import { NextRequest, NextResponse } from 'next/server';
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { createRouteHandler } from "uploadthing/next";

const f = createUploadthing();

const uploadRouter = {
  workshopRecording: f({
    video: { maxFileSize: '512MB', maxFileCount: 1 }
  })
    .middleware(async ({ req }) => {
      const session = await getServerSession(authOptions);
      if (!session?.user?.email) {
        throw new Error('Unauthorized');
      }

      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Get workshop ID from URL
      const url = new URL(req.url);
      const workshopId = url.pathname.split('/')[3];

      const workshop = await prisma.workshop.findUnique({
        where: { id: workshopId },
        select: { hostId: true },
      });

      if (!workshop) {
        throw new Error('Workshop not found');
      }

      if (workshop.hostId !== user.id) {
        throw new Error('Only the host can upload recordings');
      }

      return { userId: user.id, workshopId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      await prisma.workshop.update({
        where: { id: metadata.workshopId },
        data: {
          recording: file.url,
          status: 'COMPLETED',
        },
      });

      logger.info(`Recording uploaded for workshop ${metadata.workshopId}: ${file.url}`);
      return { url: file.url };
    }),
} satisfies FileRouter;

const { POST } = createRouteHandler({
  router: uploadRouter,
});

export { POST }; 