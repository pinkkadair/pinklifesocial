"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getDbUserId } from "./user.action";
import { logger } from "@/lib/logger";
import { RiskFactorType, RiskSeverity, User as PrismaUser } from "@prisma/client";

export interface BeautyRiskAssessment {
  id: string;
  riskScore: number;
  lastUpdated: Date;
  factors: {
    id: string;
    type: RiskFactorType;
    severity: RiskSeverity;
    description: string;
    recommendation?: string;
  }[];
}

export interface User {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  username: string;
  bio: string | null;
  location: string | null;
  website: string | null;
  followers: string[];
  following: string[];
  beautyRisk: BeautyRiskAssessment | null;
  subscriptionTier: "FREE" | "PINKU" | "VIP";
  subscriptionStatus: string | null;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    posts: number;
    followers: number;
    following: number;
  };
}

export async function getProfile(username: string): Promise<User | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        beautyAssessments: {
          include: {
            factors: true
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        },
        followers: {
          select: { followerId: true }
        },
        following: {
          select: { followingId: true }
        },
        _count: {
          select: {
            posts: true,
            followers: true,
            following: true
          }
        }
      }
    });

    if (!user) {
      return null;
    }

    const latestAssessment = user.beautyAssessments[0];

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      username: user.username,
      bio: user.bio,
      location: user.location,
      website: user.website,
      followers: user.followers.map(f => f.followerId),
      following: user.following.map(f => f.followingId),
      beautyRisk: latestAssessment ? {
        id: latestAssessment.id,
        riskScore: latestAssessment.riskScore,
        lastUpdated: latestAssessment.updatedAt,
        factors: latestAssessment.factors.map(f => ({
          id: f.id,
          type: f.type,
          severity: f.severity,
          description: f.description,
          recommendation: undefined
        }))
      } : null,
      subscriptionTier: user.subscriptionTier as "FREE" | "PINKU" | "VIP",
      subscriptionStatus: user.subscriptionStatus,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      _count: user._count
    };
  } catch (error) {
    logger.error("Failed to get user profile:", error);
    return null;
  }
}

export async function getUserPosts(userId: string) {
  try {
    const posts = await prisma.globalTeaPost.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true
          }
        },
        likes: {
          select: {
            userId: true
          }
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                username: true,
                image: true
              }
            }
          }
        },
        tags: true,
        _count: {
          select: {
            likes: true,
            comments: true
          }
        }
      }
    });

    return posts;
  } catch (error) {
    logger.error("Failed to get user posts:", error);
    throw new Error("Failed to get posts");
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

export async function updateProfile(userId: string, data: {
  name?: string;
  bio?: string;
  location?: string;
  website?: string;
}) {
  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        bio: data.bio,
        location: data.location,
        website: data.website
      },
      include: {
        beautyAssessments: {
          include: {
            factors: true
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        },
        followers: {
          select: { followerId: true }
        },
        following: {
          select: { followingId: true }
        },
        _count: {
          select: {
            posts: true,
            followers: true,
            following: true
          }
        }
      }
    });

    const latestAssessment = user.beautyAssessments[0];

    return {
      success: true,
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      username: user.username,
      bio: user.bio,
      location: user.location,
      website: user.website,
      followers: user.followers.map(f => f.followerId),
      following: user.following.map(f => f.followingId),
      beautyRisk: latestAssessment ? {
        id: latestAssessment.id,
        riskScore: latestAssessment.riskScore,
        lastUpdated: latestAssessment.updatedAt,
        factors: latestAssessment.factors.map(f => ({
          id: f.id,
          type: f.type,
          severity: f.severity,
          description: f.description,
          recommendation: undefined
        }))
      } : null,
      subscriptionTier: user.subscriptionTier as "FREE" | "PINKU" | "VIP",
      subscriptionStatus: user.subscriptionStatus,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      _count: user._count
    };
  } catch (error) {
    logger.error("Failed to update user profile:", error);
    return {
      success: false,
      error: "Failed to update profile"
    };
  }
}

export async function isFollowing(userId: string, targetUserId: string) {
  try {
    const follow = await prisma.follows.findUnique({
      where: {
        followerId_followingId: {
          followerId: userId,
          followingId: targetUserId
        }
      }
    });

    return !!follow;
  } catch (error) {
    logger.error("Failed to check follow status:", error);
    return false;
  }
}
