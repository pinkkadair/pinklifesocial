import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { Prisma } from "@prisma/client";

type WorkshopWithRelations = Prisma.WorkshopGetPayload<{
  include: {
    host: {
      select: {
        id: true;
        name: true;
        username: true;
        image: true;
      };
    };
    attendees: {
      select: {
        id: true;
        name: true;
        username: true;
        image: true;
      };
    };
  };
}>;

export async function createWorkshop(data: {
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  maxAttendees: number;
  category: string;
  level: string;
}) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      throw new Error('Unauthorized');
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, subscriptionTier: true },
    });

    if (!user || user.subscriptionTier !== 'VIP') {
      throw new Error('Only VIP members can host workshops');
    }

    const workshop = await prisma.workshop.create({
      data: {
        ...data,
        hostId: user.id,
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

    logger.info(`Workshop created: ${workshop.id}`);
    return workshop;
  } catch (error) {
    logger.error('Failed to create workshop:', error as Error);
    throw error;
  }
}

export async function getUpcomingWorkshops(limit = 10) {
  try {
    const workshops = await prisma.workshop.findMany({
      where: {
        startTime: {
          gte: new Date(),
        },
        status: 'SCHEDULED',
      },
      orderBy: {
        startTime: 'asc',
      },
      take: limit,
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

    return workshops;
  } catch (error) {
    logger.error('Failed to get upcoming workshops:', error as Error);
    throw error;
  }
}

export async function joinWorkshop(workshopId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      throw new Error('Unauthorized');
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, subscriptionTier: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (user.subscriptionTier === 'FREE') {
      throw new Error('Free users cannot join workshops');
    }

    const workshop = await prisma.workshop.findUnique({
      where: { id: workshopId },
      include: {
        attendees: {
          select: { id: true },
        },
      },
    });

    if (!workshop) {
      throw new Error('Workshop not found');
    }

    if (workshop.status !== 'SCHEDULED') {
      throw new Error('Workshop is not available for registration');
    }

    if (workshop.attendees.length >= workshop.maxAttendees) {
      throw new Error('Workshop is full');
    }

    if (workshop.attendees.some((attendee: { id: string }) => attendee.id === user.id)) {
      throw new Error('Already registered for this workshop');
    }

    const updatedWorkshop = await prisma.workshop.update({
      where: { id: workshopId },
      data: {
        attendees: {
          connect: { id: user.id },
        },
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

    logger.info(`User ${user.id} joined workshop ${workshopId}`);
    return updatedWorkshop;
  } catch (error) {
    logger.error('Failed to join workshop:', error as Error);
    throw error;
  }
}

export async function leaveWorkshop(workshopId: string) {
  try {
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

    const workshop = await prisma.workshop.findUnique({
      where: { id: workshopId },
      include: {
        attendees: {
          select: { id: true },
        },
      },
    });

    if (!workshop) {
      throw new Error('Workshop not found');
    }

    if (!workshop.attendees.some(a => a.id === user.id)) {
      throw new Error('Not registered for this workshop');
    }

    const updatedWorkshop = await prisma.workshop.update({
      where: { id: workshopId },
      data: {
        attendees: {
          disconnect: { id: user.id },
        },
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

    logger.info(`User ${user.id} left workshop ${workshopId}`);
    return updatedWorkshop;
  } catch (error) {
    logger.error('Failed to leave workshop:', error as Error);
    throw error;
  }
}

export async function updateWorkshopStatus(workshopId: string, status: 'SCHEDULED' | 'CANCELLED' | 'COMPLETED') {
  try {
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

    const workshop = await prisma.workshop.findUnique({
      where: { id: workshopId },
      select: { hostId: true },
    });

    if (!workshop) {
      throw new Error('Workshop not found');
    }

    if (workshop.hostId !== user.id) {
      throw new Error('Only the host can update workshop status');
    }

    const updatedWorkshop = await prisma.workshop.update({
      where: { id: workshopId },
      data: { status },
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

    logger.info(`Workshop ${workshopId} status updated to ${status}`);
    return updatedWorkshop;
  } catch (error) {
    logger.error('Failed to update workshop status:', error as Error);
    throw error;
  }
}

export async function getUserWorkshops() {
  try {
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

    const workshops = await prisma.workshop.findMany({
      where: {
        OR: [
          { hostId: user.id },
          { attendees: { some: { id: user.id } } },
        ],
      },
      orderBy: {
        startTime: 'asc',
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

    return workshops;
  } catch (error) {
    logger.error('Failed to get user workshops:', error as Error);
    throw error;
  }
} 