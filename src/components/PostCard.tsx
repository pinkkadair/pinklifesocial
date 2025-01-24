"use client";

import { createComment, deletePost, getPosts, toggleLike } from "@/actions/post.action";
import { useState } from "react";
import toast from "react-hot-toast";
import { Card, CardContent } from "./ui/card";
import Link from "next/link";
import { Avatar, AvatarImage } from "./ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { DeleteAlertDialog } from "./DeleteAlertDialog";
import { Button } from "./ui/button";
import { HeartIcon, LogInIcon, MessageCircleIcon, SendIcon } from "lucide-react";
import { Textarea } from "./ui/textarea";
import { useSession, signIn } from "next-auth/react";

type Posts = Awaited<ReturnType<typeof getPosts>>;
type Post = Posts[number];

function PostCard({ post, dbUserId }: { post: Post; dbUserId: string | null }) {
  const { data: session } = useSession();
  const [newComment, setNewComment] = useState("");
  const [isCommenting, setIsCommenting] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasLiked, setHasLiked] = useState(post.likes.some((like) => like.userId === dbUserId));
  const [optimisticLikes, setOptmisticLikes] = useState(post._count.likes);
  const [showComments, setShowComments] = useState(false);

  const handleLike = async () => {
    if (isLiking) return;
    try {
      setIsLiking(true);
      setHasLiked((prev) => !prev);
      setOptmisticLikes((prev) => prev + (hasLiked ? -1 : 1));
      await toggleLike(post.id);
    } catch (error) {
      setOptmisticLikes(post._count.likes);
      setHasLiked(post.likes.some((like) => like.userId === dbUserId));
    } finally {
      setIsLiking(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || isCommenting) return;
    try {
      setIsCommenting(true);
      const result = await createComment(post.id, newComment);
      if (result?.success) {
        toast.success("Comment posted successfully");
        setNewComment("");
        setShowComments(true);
      } else {
        toast.error(result?.error || "Failed to post comment");
      }
    } catch (error) {
      toast.error("Error posting comment");
    } finally {
      setIsCommenting(false);
    }
  };

  const handleDeletePost = async () => {
    if (isDeleting) return;
    try {
      setIsDeleting(true);
      const result = await deletePost(post.id);
      if (result?.success) {
        toast.success("Post deleted successfully");
      } else {
        toast.error(result?.error || "Failed to delete post");
      }
    } catch (error) {
      toast.error("Error deleting post");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Link href={`/profile/${post.author.username}`}>
              <Avatar className="h-10 w-10">
                <AvatarImage src={post.author.image || ""} alt={post.author.name || ""} />
              </Avatar>
            </Link>
            <div>
              <Link
                href={`/profile/${post.author.username}`}
                className="font-semibold hover:underline"
              >
                {post.author.name || post.author.username}
              </Link>
              <p className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
              </p>
            </div>
          </div>
          {dbUserId === post.authorId && (
            <DeleteAlertDialog onDelete={handleDeletePost} isDeleting={isDeleting} />
          )}
        </div>

        <p className="mt-4 whitespace-pre-wrap">{post.content}</p>
        {post.image && (
          <img
            src={post.image}
            alt="Post image"
            className="mt-4 rounded-lg border object-cover"
          />
        )}

        <div className="mt-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={session ? handleLike : () => signIn()}
          >
            <HeartIcon
              className={`h-5 w-5 ${hasLiked ? "fill-red-500 text-red-500" : ""}`}
            />
            <span>{optimisticLikes}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={() => setShowComments((prev) => !prev)}
          >
            <MessageCircleIcon className="h-5 w-5" />
            <span>{post._count.comments}</span>
          </Button>
        </div>

        {showComments && (
          <div className="mt-4 space-y-4">
            {session ? (
              <div className="flex items-center gap-2">
                <Textarea
                  placeholder="Write a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={1}
                />
                <Button
                  size="icon"
                  onClick={handleAddComment}
                  disabled={!newComment.trim() || isCommenting}
                >
                  <SendIcon className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button onClick={() => signIn()} className="w-full gap-2">
                <LogInIcon className="h-4 w-4" />
                Sign in to comment
              </Button>
            )}

            <div className="space-y-4">
              {post.comments.map((comment) => (
                <div key={comment.id} className="flex items-start gap-3">
                  <Link href={`/profile/${comment.author.username}`}>
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={comment.author.image || ""}
                        alt={comment.author.name || ""}
                      />
                    </Avatar>
                  </Link>
                  <div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/profile/${comment.author.username}`}
                        className="text-sm font-semibold hover:underline"
                      >
                        {comment.author.name || comment.author.username}
                      </Link>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                    <p className="text-sm">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default PostCard;
