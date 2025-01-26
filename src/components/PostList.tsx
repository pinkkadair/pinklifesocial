import { useState } from "react";
import PostCard from "@/components/PostCard";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useSession } from "next-auth/react";

interface Post {
  id: string;
  content: string | null;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
  authorId: string;
  author: {
    id: string;
    name: string | null;
    username: string;
    image: string | null;
  };
  comments: Array<{
    id: string;
    content: string;
    createdAt: Date;
    authorId: string;
    postId: string;
    author: {
      id: string;
      name: string | null;
      username: string;
      image: string | null;
    };
  }>;
  likes: Array<{
    userId: string;
  }>;
  _count: {
    likes: number;
    comments: number;
  };
}

interface PostListProps {
  posts: Post[];
  isLoading?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

export function PostList({ posts, isLoading, onLoadMore, hasMore }: PostListProps) {
  const { data: session } = useSession();
  const dbUserId = session?.user?.id || null;

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No posts yet
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} dbUserId={dbUserId} />
      ))}
      {hasMore && (
        <div className="flex justify-center py-4">
          <Button
            variant="outline"
            onClick={onLoadMore}
            disabled={isLoading}
          >
            {isLoading ? <LoadingSpinner /> : "Load More"}
          </Button>
        </div>
      )}
    </div>
  );
} 
