import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/lib/auth";
// Removed authOptions import - using auth() directly;
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
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
      select: {
        hostId: true,
        status: true,
        endTime: true,
      },
    });

    if (!workshop) {
      return new NextResponse('Workshop not found', { status: 404 });
    }

    if (workshop.hostId !== user.id) {
      return new NextResponse('Only the host can complete the workshop', { status: 403 });
    }

    if (workshop.status !== 'SCHEDULED') {
      return new NextResponse('Workshop is not in a scheduled state', { status: 400 });
    }

    // Only allow completing workshops that have ended
    if (new Date(workshop.endTime) > new Date()) {
      return new NextResponse('Workshop has not ended yet', { status: 400 });
    }

    const updatedWorkshop = await prisma.workshop.update({
      where: { id: params.id },
      data: {
        status: 'COMPLETED',
      },
      include: {
        host: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
        attendees: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
      },
    });

    logger.info(`Workshop ${params.id} marked as completed by host ${user.id}`);
    return NextResponse.json(updatedWorkshop);
  } catch (error) {
    logger.error('Failed to complete workshop:', error as Error);
    return new NextResponse('Internal server error', { status: 500 });
  }
} 