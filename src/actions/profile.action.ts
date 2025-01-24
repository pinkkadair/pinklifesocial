"use server";

import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getDbUserId } from "./user.action";

export async function getProfileByUsername(username: string) {
  console.log("getProfileByUsername called with:", username);
  
  if (!username) {
    console.log("Username is empty");
    throw new Error("Username is required");
  }

  try {
    console.log("Attempting to find user in database...");
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        bio: true,
        image: true,
        location: true,
        website: true,
        createdAt: true,
        subscriptionTier: true,
        beautyRisk: {
          include: {
            factors: true,
          },
        },
        _count: {
          select: {
            followers: true,
            following: true,
            posts: true,
          },
        },
      },
    });

    console.log("Database query completed. User found:", !!user);
    if (!user) {
      console.log(`No user found with username: ${username}`);
      return null;
    }

    return user;
  } catch (error) {
    console.error("Database error in getProfileByUsername:", error);
    throw error;
  }
}

export async function getUserPosts(userId: string) {
  console.log("getUserPosts called for userId:", userId);
  
  if (!userId) {
    console.log("No userId provided to getUserPosts");
    return [];
  }

  try {
    const posts = await prisma.post.findMany({
      where: {
        authorId: userId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                username: true,
                image: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        likes: {
          select: {
            userId: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log(`Found ${posts.length} posts for user ${userId}`);
    return posts;
  } catch (error) {
    console.error("Error in getUserPosts:", error);
    return [];
  }
}

export async function getUserLikedPosts(userId: string) {
  console.log("getUserLikedPosts called for userId:", userId);
  
  if (!userId) {
    console.log("No userId provided to getUserLikedPosts");
    return [];
  }

  try {
    const likedPosts = await prisma.post.findMany({
      where: {
        likes: {
          some: {
            userId,
          },
        },
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                username: true,
                image: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        likes: {
          select: {
            userId: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log(`Found ${likedPosts.length} liked posts for user ${userId}`);
    return likedPosts;
  } catch (error) {
    console.error("Error fetching liked posts:", error);
    return [];
  }
}

export async function updateProfile(formData: FormData) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      console.log("No session found in updateProfile");
      throw new Error("Unauthorized");
    }

    const name = formData.get("name") as string;
    const bio = formData.get("bio") as string;
    const location = formData.get("location") as string;
    const website = formData.get("website") as string;

    console.log("Updating profile for email:", session.user.email);
    const user = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        name: name || null,
        bio: bio || null,
        location: location || null,
        website: website || null,
      },
    });

    console.log("Profile updated successfully");
    revalidatePath("/profile");
    return { success: true, user };
  } catch (error) {
    console.error("Error updating profile:", error);
    return { success: false, error: "Failed to update profile" };
  }
}

export async function isFollowing(userId: string) {
  try {
    const currentUserId = await getDbUserId();
    if (!currentUserId) {
      console.log("No current user ID found in isFollowing");
      return false;
    }

    const follow = await prisma.follows.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: userId,
        },
      },
    });

    return !!follow;
  } catch (error) {
    console.error("Error checking follow status:", error);
    return false;
  }
}
