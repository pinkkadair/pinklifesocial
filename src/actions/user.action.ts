"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";

export async function syncUser() {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      console.log("No session found in syncUser");
      return null;
    }

    console.log("Checking for existing user with email:", session.user.email);
    const existingUser = await prisma.user.findUnique({
      where: {
        email: session.user.email,
      },
    });

    if (existingUser) {
      console.log("Existing user found, returning user");
      return existingUser;
    }

    console.log("Creating new user for email:", session.user.email);
    const dbUser = await prisma.user.create({
      data: {
        email: session.user.email,
        name: session.user.name || "",
        username: session.user.email.split("@")[0],
        image: session.user.image || "",
        subscriptionTier: 'FREE',
      },
    });

    console.log("New user created successfully");
    return dbUser;
  } catch (error) {
    console.error("Error in syncUser:", error);
    return null;
  }
}

export async function getDbUserId() {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      console.log("No session found in getDbUserId");
      return null;
    }

    console.log("Looking up user ID for email:", session.user.email);
    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email,
      },
      select: {
        id: true,
      },
    });

    if (!user) {
      console.log("No user found for email:", session.user.email);
      return null;
    }

    return user.id;
  } catch (error) {
    console.error("Error in getDbUserId:", error);
    return null;
  }
}

export async function getRandomUsers() {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      console.log("No session found in getRandomUsers");
      return [];
    }

    console.log("Finding current user and their following list");
    const currentUser = await prisma.user.findUnique({
      where: {
        email: session.user.email,
      },
      select: {
        id: true,
        following: {
          select: {
            followingId: true,
          },
        },
      },
    });

    if (!currentUser) {
      console.log("Current user not found in database");
      return [];
    }

    const followingIds = currentUser.following.map((f) => f.followingId);
    followingIds.push(currentUser.id); // Add current user to exclude list

    console.log("Fetching random users excluding current user and following");
    const users = await prisma.user.findMany({
      where: {
        AND: [
          {
            id: {
              notIn: followingIds,
            },
          },
          {
            email: {
              not: session.user.email,
            },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
        _count: {
          select: {
            followers: true,
            following: true,
          },
        },
      },
      take: 3,
      orderBy: {
        followers: {
          _count: "desc",
        },
      },
    });

    console.log(`Found ${users.length} random users to suggest`);
    return users;
  } catch (error) {
    console.error("Error in getRandomUsers:", error);
    return [];
  }
}

export async function toggleFollow(targetUserId: string) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      console.log("No session found in toggleFollow");
      throw new Error("Unauthorized");
    }

    console.log("Looking up current user");
    const currentUser = await prisma.user.findUnique({
      where: {
        email: session.user.email,
      },
      select: {
        id: true,
      },
    });

    if (!currentUser) {
      console.log("Current user not found in database");
      throw new Error("User not found");
    }

    console.log("Checking existing follow relationship");
    const existingFollow = await prisma.follows.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUser.id,
          followingId: targetUserId,
        },
      },
    });

    if (existingFollow) {
      console.log("Removing existing follow");
      await prisma.follows.delete({
        where: {
          followerId_followingId: {
            followerId: currentUser.id,
            followingId: targetUserId,
          },
        },
      });
    } else {
      console.log("Creating new follow");
      await prisma.follows.create({
        data: {
          followerId: currentUser.id,
          followingId: targetUserId,
        },
      });

      console.log("Creating follow notification");
      await prisma.notification.create({
        data: {
          userId: targetUserId,
          creatorId: currentUser.id,
          type: "FOLLOW",
        },
      });
    }

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error in toggleFollow:", error);
    return { success: false, error: "Failed to toggle follow" };
  }
}

export async function updateSubscriptionTier(tier: 'PINKU' | 'VIP') {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      console.log("No session found in updateSubscriptionTier");
      return { success: false, error: "Unauthorized" };
    }

    console.log(`Updating subscription tier to ${tier} for email:`, session.user.email);
    const user = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        subscriptionTier: tier,
      },
    });

    console.log("Subscription tier updated successfully");
    revalidatePath("/profile");
    return { success: true, user };
  } catch (error) {
    console.error("Error updating subscription tier:", error);
    return { success: false, error: "Failed to update subscription tier" };
  }
}
