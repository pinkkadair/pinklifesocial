import { getPosts } from "@/actions/post.action";
import { getDbUserId } from "@/actions/user.action";
import CreatePost from "@/components/CreatePost";
import PostCard from "@/components/PostCard";
import WhoToFollow from "@/components/WhoToFollow";
import { auth } from "@/lib/auth";
import { Suspense } from "react";
import { LoadingSpinner } from "@/components/LoadingSpinner";

export default async function Home() {
  const session = await auth();
  
  try {
    const [posts, dbUserId] = await Promise.all([
      getPosts().catch(() => []),
      session?.user ? getDbUserId().catch(() => null) : null,
    ]);

    return (
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        <div className="lg:col-span-6">
          {session?.user ? (
            <Suspense fallback={<LoadingSpinner />}>
              <CreatePost />
            </Suspense>
          ) : null}

          <div className="space-y-6">
            {posts.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-muted-foreground">No posts yet. Be the first to share!</p>
              </div>
            ) : (
              <Suspense fallback={<LoadingSpinner />}>
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} dbUserId={dbUserId} />
                ))}
              </Suspense>
            )}
          </div>
        </div>

        <div className="hidden lg:block lg:col-span-4 sticky top-20">
          <Suspense fallback={<LoadingSpinner />}>
            <WhoToFollow />
          </Suspense>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error loading home page:", error);
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">Something went wrong. Please try again later.</p>
      </div>
    );
  }
}
