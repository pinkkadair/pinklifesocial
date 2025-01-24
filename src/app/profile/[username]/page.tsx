import { Suspense } from "react";
import {
  getProfileByUsername,
  getUserLikedPosts,
  getUserPosts,
  isFollowing,
} from "@/actions/profile.action";
import { notFound } from "next/navigation";
import ProfilePageClient from "./ProfilePageClient";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { logger } from "@/lib/logger";

export async function generateMetadata({ params }: { params: { username: string } }) {
  try {
    const decodedUsername = decodeURIComponent(params.username);
    const user = await getProfileByUsername(decodedUsername);
    if (!user) {
      return {
        title: "Profile Not Found",
        description: "This profile does not exist.",
      };
    }

    return {
      title: `${user.name ?? user.username}`,
      description: user.bio || `Check out ${user.username}'s profile.`,
    };
  } catch (error) {
    logger.error("Error generating metadata:", error);
    return {
      title: "Error",
      description: "Failed to load profile.",
    };
  }
}

export default async function ProfilePageServer({ params }: { params: { username: string } }) {
  try {
    if (!params.username) {
      logger.error("No username provided");
      return notFound();
    }

    // Decode username from URL
    const decodedUsername = decodeURIComponent(params.username);
    logger.info(`Loading profile for username: ${decodedUsername}`);

    // Fetch user profile
    const user = await getProfileByUsername(decodedUsername);
    if (!user) {
      logger.error(`No user found with username: ${decodedUsername}`);
      return notFound();
    }

    // Fetch additional user data in parallel
    const [posts, likedPosts, isCurrentUserFollowing] = await Promise.all([
      getUserPosts(user.id).catch(error => {
        logger.error("Error fetching posts:", error);
        return [];
      }),
      getUserLikedPosts(user.id).catch(error => {
        logger.error("Error fetching liked posts:", error);
        return [];
      }),
      isFollowing(user.id).catch(error => {
        logger.error("Error checking follow status:", error);
        return false;
      })
    ]);

    logger.info("Successfully loaded profile data");

    return (
      <div className="container mx-auto px-4 py-8">
        <Suspense fallback={<LoadingSpinner />}>
          <ProfilePageClient
            user={user}
            posts={posts}
            likedPosts={likedPosts}
            isFollowing={isCurrentUserFollowing}
          />
        </Suspense>
      </div>
    );
  } catch (error) {
    logger.error("Error in ProfilePageServer:", error);
    throw error; // Let Next.js error boundary handle it
  }
}
