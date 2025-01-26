import { Suspense } from "react";
import {
  getUserLikedPosts,
  getUserPosts,
  isFollowing,
  getProfile,
} from "@/actions/profile.action";
import { notFound, redirect } from "next/navigation";
import ProfilePageClient from "./ProfilePageClient";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { logger } from "@/lib/logger";
import { auth } from "@/lib/auth";

export async function generateMetadata({ params }: { params: { username: string } }) {
  try {
    const decodedUsername = decodeURIComponent(params.username);
    const user = await getProfile(decodedUsername);
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

export default async function ProfilePage({ params }: { params: { username: string }; }) {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/signin");
  }

  const user = await getProfile(params.username);
  if (!user) {
    redirect("/404");
  }

  const [posts, likedPosts, isUserFollowing] = await Promise.all([
    getUserPosts(user.id),
    getUserLikedPosts(user.id),
    isFollowing(session.user.id, user.id)
  ]);

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProfilePageClient
        user={user}
        posts={posts}
        likedPosts={likedPosts}
        isFollowing={isUserFollowing}
        isCurrentUser={session.user.id === user.id}
      />
    </Suspense>
  );
}
