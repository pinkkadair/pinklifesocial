"use client";

import { createPost } from "@/actions/post.action";
import { useSession } from "next-auth/react";
import { useState } from "react";
import toast from "react-hot-toast";
import { Card, CardContent } from "./ui/card";
import { Avatar, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { ImageIcon, Loader2Icon, SendIcon } from "lucide-react";
import { UploadButton } from "@uploadthing/react";
import { OurFileRouter } from "@/app/api/uploadthing/core";

export default function CreatePost() {
  const { data: session } = useSession();
  const [content, setContent] = useState("");
  const [image, setImage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const result = await createPost(content, image);
      if (result?.success) {
        toast.success("Post created successfully");
        setContent("");
        setImage("");
      } else {
        toast.error(result?.error || "Failed to create post");
      }
    } catch (error) {
      toast.error("Error creating post");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex gap-4">
          <Avatar className="h-10 w-10">
            <AvatarImage src={session?.user?.image || ""} alt={session?.user?.name || ""} />
          </Avatar>
          <div className="flex-1 space-y-4">
            <Textarea
              placeholder="What's on your mind?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
            />
            {image && (
              <div className="relative">
                <img
                  src={image}
                  alt="Upload preview"
                  className="rounded-lg border object-cover max-h-[300px] w-full"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 bg-background/80 hover:bg-background/60"
                  onClick={() => setImage("")}
                >
                  <ImageIcon className="h-4 w-4" />
                </Button>
              </div>
            )}
            <div className="flex justify-between items-center">
              <UploadButton<OurFileRouter, "profileImage">
                endpoint="profileImage"
                onClientUploadComplete={(res: { url: string }[]) => {
                  setImage(res?.[0]?.url || "");
                  toast.success("Image uploaded successfully");
                }}
                onUploadError={(error: Error) => {
                  toast.error(`Error uploading image: ${error.message}`);
                }}
              />
              <Button
                onClick={handleSubmit}
                disabled={!content.trim() || isSubmitting}
                className="gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2Icon className="h-4 w-4 animate-spin" />
                    Posting...
                  </>
                ) : (
                  <>
                    <SendIcon className="h-4 w-4" />
                    Post
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
