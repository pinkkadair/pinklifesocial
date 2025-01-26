import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { auth } from "@/lib/auth";

export async function DELETE() {
  try {
    await prisma.user.deleteMany({
      where: {
        OR: [
          { email: 'test@example.com' },
          { username: 'testuser' }
        ]
      }
    });

    return NextResponse.json({ message: 'Test user deleted successfully' });
  } catch (error) {
    console.error('Error deleting test user:', error);
    return NextResponse.json(
      { error: 'Failed to delete test user' },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const tempPassword = 'Test123!@#';
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Delete existing test user if any
    await prisma.user.deleteMany({
      where: {
        OR: [
          { email: 'test@example.com' },
          { username: 'testuser' }
        ]
      }
    });

    const testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        username: 'testuser',
        name: 'Test User',
        bio: 'This is a test user account',
        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=testuser',
        location: 'Test City',
        website: 'https://example.com',
        subscriptionTier: 'VIP',
        password: hashedPassword,
      },
    });

    // Return user data with the temporary password (only for testing purposes)
    return NextResponse.json({
      ...testUser,
      tempPassword, // Include the temporary password in the response
    });
  } catch (error) {
    console.error('Error creating test user:', error);
    return NextResponse.json(
      { error: 'Failed to create test user' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        bio: true,
        image: true,
        location: true,
        website: true,
        subscriptionTier: true,
        createdAt: true,
        _count: {
          select: {
            followers: true,
            following: true,
            posts: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error getting test user:', error);
    return NextResponse.json(
      { error: 'Failed to get test user' },
      { status: 500 }
    );
  }
} 