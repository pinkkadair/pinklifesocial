"use client";

import { useState } from "react";
import { UploadButton } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CameraIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

interface ProfileImageUploadProps {
  currentImage?: string | null;
  username: string;
  name?: string | null;
}

export function ProfileImageUpload({ currentImage, username, name }: ProfileImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | undefined>(currentImage || undefined);
  const router = useRouter();

  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : username[0].toUpperCase();

  const handleUploadComplete = async (res: { url: string }[]) => {
    try {
      toast.dismiss();
      if (!res?.[0]?.url) {
        throw new Error("No URL in upload response");
      }

      setIsUploading(false);
      setImageUrl(res[0].url);
      toast.success("Image uploaded successfully!");

      // Force a cache revalidation and refresh
      router.refresh();

      // Double-check after a short delay to ensure the image is loaded
      setTimeout(() => {
        if (!document.querySelector(`img[src="${res[0].url}"]`)) {
          toast.error("Image may not have loaded properly. Please refresh the page.");
        }
      }, 1000);
    } catch (error) {
      console.error("Error handling upload completion:", error);
      toast.error("Error updating profile image");
    }
  };

  return (
    <div className="relative group">
      <Avatar className="h-24 w-24">
        <AvatarImage src={imageUrl} alt={username} />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div
        className={cn(
          "absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity",
          isUploading && "opacity-100"
        )}
      >
        <div className="w-full h-full flex items-center justify-center">
          <UploadButton<OurFileRouter, "profileImage">
            endpoint="profileImage"
            onUploadBegin={() => {
              setIsUploading(true);
              toast.loading("Uploading image...");
            }}
            onClientUploadComplete={handleUploadComplete}
            onUploadError={(error: Error) => {
              toast.dismiss();
              console.error("Error uploading image:", error);
              setIsUploading(false);
              if (error.message.includes("File too large")) {
                toast.error("Image must be less than 4MB");
              } else if (error.message.includes("Invalid file type")) {
                toast.error("Only image files are allowed (JPG, PNG, WebP)");
              } else {
                toast.error(error.message || "Error uploading image");
              }
            }}
            appearance={{
              button: "bg-transparent hover:bg-transparent text-white hover:text-white/80",
              allowedContent: "hidden",
            }}
          >
            <div className="flex items-center justify-center">
              <CameraIcon className="h-6 w-6" />
            </div>
          </UploadButton>
        </div>
      </div>
    </div>
  );
} 