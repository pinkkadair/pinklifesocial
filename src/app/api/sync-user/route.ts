import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { usernameSchema } from '@/lib/validations/user';

function generateValidUsername(email: string): string {
  // Remove special characters and spaces, keep only alphanumeric and underscores
  const baseUsername = email.split('@')[0]
    .replace(/[^a-zA-Z0-9_]/g, '_')
    .toLowerCase();
  
  // Ensure it meets minimum length
  if (baseUsername.length < 3) {
    return `user_${baseUsername}`;
  }
  
  return baseUsername;
}

export async function POST() {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Generate a valid username from email
    const baseUsername = generateValidUsername(session.user.email);
    
    // Check if username exists and generate a unique one if needed
    let username = baseUsername;
    let counter = 1;
    
    while (true) {
      try {
        // Validate the username
        usernameSchema.parse(username);
        
        // Check if username is taken
        const existingUser = await prisma.user.findUnique({
          where: { username },
          select: { id: true },
        });
        
        if (!existingUser) {
          break; // Username is valid and available
        }
        
        // Try next number
        username = `${baseUsername}${counter}`;
        counter++;
      } catch (error) {
        // If validation fails, try with next number
        username = `${baseUsername}${counter}`;
        counter++;
      }
    }

    // Sync user data
    const syncedUser = await prisma.user.upsert({
      where: { email: session.user.email },
      create: {
        email: session.user.email,
        username,
        name: session.user.name || username,
        image: session.user.image || '',
        subscriptionTier: 'FREE',
      },
      update: {
        name: session.user.name || username,
        image: session.user.image || '',
      },
    });

    return NextResponse.json(syncedUser);
  } catch (error) {
    console.error('Error in POST /api/sync-user:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 