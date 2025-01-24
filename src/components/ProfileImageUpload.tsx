"use client";

import { useState } from "react";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { UploadButton } from "@uploadthing/react";
import { OurFileRouter } from "@/app/api/uploadthing/core";
import { Loader2Icon } from "lucide-react";
import toast from "react-hot-toast";

interface ProfileImageUploadProps {
  currentImage: string | null;
  username: string;
  name: string | null;
}

export function ProfileImageUpload({
  currentImage,
  username,
  name,
}: ProfileImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);

  return (
    <div className="relative">
      <Avatar className="h-24 w-24">
        <AvatarImage src={currentImage || ""} alt={name || username} />
      </Avatar>
      <div className="absolute -bottom-2 -right-2">
        <Button
          variant="outline"
          size="icon"
          className="rounded-full"
          disabled={isUploading}
        >
          {isUploading ? (
            <Loader2Icon className="h-4 w-4 animate-spin" />
          ) : (
            <UploadButton<OurFileRouter, "profileImage">
              endpoint="profileImage"
              onUploadBegin={() => {
                setIsUploading(true);
              }}
              onClientUploadComplete={async (res) => {
                setIsUploading(false);
                if (res?.[0]?.url) {
                  toast.success("Profile image updated successfully");
                  // Force a page refresh to show the new image
                  window.location.reload();
                }
              }}
              onUploadError={(error: Error) => {
                setIsUploading(false);
                toast.error(`Error uploading image: ${error.message}`);
              }}
              appearance={{
                button: {
                  width: "16px",
                  height: "16px",
                },
              }}
            />
          )}
        </Button>
      </div>
    </div>
  );
} 