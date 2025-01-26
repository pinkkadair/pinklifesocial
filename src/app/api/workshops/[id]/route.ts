import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/lib/auth";
// Removed authOptions import - using auth() directly;
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import * as z from 'zod';

const updateWorkshopSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  startTime: z.string().or(z.date()),
  endTime: z.string().or(z.date()),
  maxAttendees: z.number().min(1).max(100),
  category: z.string().min(1),
  level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
});

export async function PATCH(
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
      select: { hostId: true },
    });

    if (!workshop) {
      return new NextResponse('Workshop not found', { status: 404 });
    }

    if (workshop.hostId !== user.id) {
      return new NextResponse('Only the host can update the workshop', { status: 403 });
    }

    const body = await req.json();
    const validatedData = updateWorkshopSchema.parse(body);

    const updatedWorkshop = await prisma.workshop.update({
      where: { id: params.id },
      data: {
        ...validatedData,
        startTime: new Date(validatedData.startTime),
        endTime: new Date(validatedData.endTime),
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

    logger.info(`Workshop ${params.id} updated by user ${user.id}`);
    return NextResponse.json(updatedWorkshop);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse('Invalid request data', { status: 400 });
    }

    logger.error('Failed to update workshop:', error as Error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}

export async function DELETE(
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
      select: { hostId: true },
    });

    if (!workshop) {
      return new NextResponse('Workshop not found', { status: 404 });
    }

    if (workshop.hostId !== user.id) {
      return new NextResponse('Only the host can delete the workshop', { status: 403 });
    }

    await prisma.workshop.delete({
      where: { id: params.id },
    });

    logger.info(`Workshop ${params.id} deleted by user ${user.id}`);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    logger.error('Failed to delete workshop:', error as Error);
    return new NextResponse('Internal server error', { status: 500 });
  }
} 