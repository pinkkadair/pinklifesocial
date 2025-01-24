import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { createUploadthing, type FileRouter } from 'uploadthing/next';

const f = createUploadthing();

const handleAuth = async () => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return false;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });

  return user;
};

export const ourFileRouter = {
  workshopRecording: f({ video: { maxFileSize: '512MB', maxFileCount: 1 } })
    .middleware(async ({ req }) => {
      const user = await handleAuth();
      if (!user) throw new Error('Unauthorized');

      const workshopId = req.headers.get('x-workshop-id');
      if (!workshopId) throw new Error('Workshop ID is required');

      const workshop = await prisma.workshop.findUnique({
        where: { id: workshopId },
        select: { hostId: true },
      });

      if (!workshop) throw new Error('Workshop not found');
      if (workshop.hostId !== user.id) throw new Error('Only the host can upload recordings');

      return { workshopId, userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      try {
        const { workshopId } = metadata;

        await prisma.workshop.update({
          where: { id: workshopId },
          data: {
            recording: file.url,
            status: 'COMPLETED',
          },
        });

        logger.info(`Recording uploaded for workshop ${workshopId}: ${file.url}`);
      } catch (error) {
        logger.error('Failed to update workshop with recording:', error as Error);
        throw error;
      }
    }),
} satisfies FileRouter;

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    const workshop = await prisma.workshop.findUnique({
      where: { id: params.id },
      select: { hostId: true },
    });

    if (!workshop) {
      return new NextResponse('Workshop not found', { status: 404 });
    }

    if (workshop.hostId !== user.id) {
      return new NextResponse('Only the host can upload recordings', { status: 403 });
    }

    // The actual file upload is handled by the uploadthing middleware
    // This endpoint is just for validation and setup

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Failed to handle recording upload:', error as Error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}

export type OurFileRouter = typeof ourFileRouter; 