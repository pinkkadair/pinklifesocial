import { exec } from 'child_process';
import { promisify } from 'util';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { format } from 'date-fns';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

const execAsync = promisify(exec);

// Configure S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-west-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

async function createDatabaseBackup() {
  try {
    const timestamp = format(new Date(), 'yyyy-MM-dd-HH-mm-ss');
    const backupFileName = `backup-${timestamp}.sql`;
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      throw new Error('DATABASE_URL is not defined');
    }

    // Extract database credentials from URL
    const url = new URL(databaseUrl);
    const host = url.hostname;
    const database = url.pathname.slice(1);
    const username = url.username;
    const password = url.password;

    // Create backup
    logger.info('Starting database backup...');
    
    const { stdout, stderr } = await execAsync(
      `PGPASSWORD="${password}" pg_dump -h ${host} -U ${username} -d ${database} -F c -b -v -f ${backupFileName}`
    );

    if (stderr) {
      logger.warn('Backup warning:', stderr);
    }

    // Upload to S3
    logger.info('Uploading backup to S3...');
    
    const bucketName = process.env.AWS_BACKUP_BUCKET;
    if (!bucketName) {
      throw new Error('AWS_BACKUP_BUCKET is not defined');
    }

    const s3Path = `database-backups/${backupFileName}`;
    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: s3Path,
        Body: require('fs').readFileSync(backupFileName),
      })
    );

    // Clean up local file
    await execAsync(`rm ${backupFileName}`);

    // Log backup metadata to database
    await prisma.backup.create({
      data: {
        fileName: backupFileName,
        s3Path,
        size: stdout.length,
        status: 'completed',
      },
    });

    logger.info('Database backup completed successfully');
    return true;
  } catch (error) {
    logger.error('Database backup failed:', error);
    
    // Log failed backup attempt
    if (error instanceof Error) {
      await prisma.backup.create({
        data: {
          fileName: 'backup-failed',
          status: 'failed',
          error: error.message,
        },
      });
    }
    
    throw error;
  }
}

// Cleanup old backups (keep last 30 days)
async function cleanupOldBackups() {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const oldBackups = await prisma.backup.findMany({
      where: {
        createdAt: {
          lt: thirtyDaysAgo,
        },
        status: 'completed',
      },
    });

    for (const backup of oldBackups) {
      if (backup.s3Path) {
        // Delete from S3
        await s3Client.send(
          new PutObjectCommand({
            Bucket: process.env.AWS_BACKUP_BUCKET || '',
            Key: backup.s3Path,
          })
        );
      }

      // Delete from database
      await prisma.backup.delete({
        where: { id: backup.id },
      });
    }

    logger.info(`Cleaned up ${oldBackups.length} old backups`);
  } catch (error) {
    logger.error('Backup cleanup failed:', error);
    throw error;
  }
}

// Export for use in cron job
export { createDatabaseBackup, cleanupOldBackups }; 