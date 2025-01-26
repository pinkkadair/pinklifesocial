"use client";

import { createUploadthing, type FileRouter } from "uploadthing/next";
import { generateReactHelpers } from "@uploadthing/react";
import { UploadButton } from "@uploadthing/react";
import { auth } from "@/lib/auth";
import { logger } from "./logger";
import { prisma } from "./prisma";
import { ApiError } from "./api-error";
import { scanBuffer } from "./virus-scan";

const f = createUploadthing();

// Helper function to convert ArrayBuffer to Buffer
const arrayBufferToBuffer = (arrayBuffer: ArrayBuffer): Buffer => {
  return Buffer.from(new Uint8Array(arrayBuffer));
};

// Validate file upload
const validateFileUpload = async (file: { name: string; size: number; buffer: ArrayBuffer }) => {
  // Check file extension
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.mp4', '.webm'];
  const ext = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  if (!allowedExtensions.includes(ext)) {
    throw new ApiError("Invalid file type", 400);
  }

  // Convert ArrayBuffer to Buffer for virus scanning
  const buffer = arrayBufferToBuffer(file.buffer);

  // Scan for viruses
  const scanResult = await scanBuffer(buffer);
  if (!scanResult.isClean) {
    throw new ApiError(`Malware detected: ${scanResult.threat}`, 400);
  }

  // Log file upload attempt
  logger.info({
    event: "file_upload_attempt",
    fileName: file.name,
    fileSize: file.size,
    fileType: ext,
  });

  return true;
};

// Allowed file types
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm"];

// Max file sizes
const MAX_IMAGE_SIZE = 8 * 1024 * 1024; // 8MB
const MAX_VIDEO_SIZE = 512 * 1024 * 1024; // 512MB

// Get authenticated user with subscription check
const getAuthenticatedUser = async () => {
  const session = await auth();
  if (!session?.user) {
    throw new ApiError("Unauthorized", 401);
  }
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      subscriptionTier: true,
    }
  });
  if (!user) {
    throw new ApiError("User not found", 404);
  }
  return user;
};

export const uploadRouter = {
  // Profile image upload - available to all users
  profileImage: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async () => {
      const user = await getAuthenticatedUser();
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      await validateFileUpload({ 
        name: file.name, 
        size: file.size, 
        buffer: await (await fetch(file.url)).arrayBuffer() as ArrayBuffer 
      });

      logger.info({
        event: "profile_image_uploaded",
        userId: metadata.userId,
        fileUrl: file.url,
      });

      await prisma.user.update({
        where: { id: metadata.userId },
        data: { image: file.url }
      });
    }),

  // Post image upload - available to all users
  postImage: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async () => {
      const user = await getAuthenticatedUser();
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      await validateFileUpload({ 
        name: file.name, 
        size: file.size, 
        buffer: await (await fetch(file.url)).arrayBuffer() as ArrayBuffer 
      });

      logger.info({
        event: "post_image_uploaded",
        userId: metadata.userId,
        fileUrl: file.url,
      });
    }),

  // Workshop recording upload - only for PINKU and VIP users
  workshopRecording: f({ 
    video: { 
      maxFileSize: "512MB",
      maxFileCount: 1,
    }
  })
    .middleware(async () => {
      const user = await getAuthenticatedUser();
      
      // Tree-shake workshop recording for non-premium users
      if (user.subscriptionTier !== 'PINKU' && user.subscriptionTier !== 'VIP') {
        throw new ApiError("Only instructors can upload workshop recordings", 403);
      }
      
      return { userId: user.id, subscriptionTier: user.subscriptionTier };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
        throw new ApiError("Invalid video type", 400);
      }

      await validateFileUpload({ 
        name: file.name, 
        size: file.size, 
        buffer: await (await fetch(file.url)).arrayBuffer() as ArrayBuffer 
      });

      logger.info({
        event: "workshop_video_uploaded",
        userId: metadata.userId,
        subscriptionTier: metadata.subscriptionTier,
        fileUrl: file.url,
      });
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof uploadRouter;

export { UploadButton };
export const { useUploadThing, uploadFiles } = generateReactHelpers<OurFileRouter>();
