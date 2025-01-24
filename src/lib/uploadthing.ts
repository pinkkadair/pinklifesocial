"use client";

import { createUploadthing, type FileRouter } from "uploadthing/next";
import { generateReactHelpers } from "@uploadthing/react";
import { UploadButton } from "@uploadthing/react";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { validateFileUpload } from "./security";
import { logger } from "./logger";
import { ApiError } from "./api-middleware";

const f = createUploadthing();

interface User {
  id: string;
  subscriptionTier: 'FREE' | 'PINKU' | 'VIP';
}

const auth = async (): Promise<User> => {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Unauthorized");
  return session.user as User;
};

const handleAuth = async () => {
  const user = await auth();
  return { userId: user.id, subscriptionTier: user.subscriptionTier };
};

// Allowed file types
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm"];

// Max file sizes
const MAX_IMAGE_SIZE = 8 * 1024 * 1024; // 8MB
const MAX_VIDEO_SIZE = 512 * 1024 * 1024; // 512MB

const validateFile = (file: { name: string; size: number; type: string }) => {
  // Validate file name
  if (!validateFileUpload(file.name)) {
    throw new ApiError("Invalid file type", 400);
  }

  // Log file upload attempt
  logger.info({
    event: "file_upload_attempt",
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
  });

  return true;
};

export const ourFileRouter = {
  profileImage: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async () => {
      const user = await handleAuth();
      return { userId: user.userId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      validateFile(file);
      logger.info({
        event: "profile_image_uploaded",
        userId: metadata.userId,
        fileUrl: file.url,
      });
    }),

  postImage: f({ 
    image: { 
      maxFileSize: "8MB",
      maxFileCount: 1,
    }
  })
    .middleware(async () => {
      const user = await handleAuth();
      return { userId: user.userId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        throw new ApiError("Invalid image type", 400);
      }
      validateFile(file);
      logger.info({
        event: "post_image_uploaded",
        userId: metadata.userId,
        fileUrl: file.url,
      });
    }),

  workshopRecording: f({ 
    video: { 
      maxFileSize: "512MB",
      maxFileCount: 1,
    }
  })
    .middleware(async () => {
      const user = await handleAuth();
      if (user.subscriptionTier !== 'PINKU' && user.subscriptionTier !== 'VIP') {
        throw new ApiError("Only instructors can upload workshop recordings", 403);
      }
      return { userId: user.userId, subscriptionTier: user.subscriptionTier };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
        throw new ApiError("Invalid video type", 400);
      }
      validateFile(file);
      logger.info({
        event: "workshop_video_uploaded",
        userId: metadata.userId,
        fileUrl: file.url,
      });
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;

export { UploadButton };
export const { useUploadThing, uploadFiles } = generateReactHelpers<OurFileRouter>();
