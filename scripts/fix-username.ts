import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixUsername() {
  try {
    // Find user with problematic username
    const user = await prisma.user.findFirst({
      where: {
        username: 'Kris, FNP-BC'
      }
    });

    if (!user) {
      console.log('User not found');
      return;
    }

    // Update to safe username
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        username: 'kris_fnp_bc'
      }
    });

    console.log('Successfully updated user:', updatedUser);
  } catch (error) {
    console.error('Error updating username:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixUsername(); 