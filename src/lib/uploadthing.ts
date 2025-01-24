"use client";

import { createUploadthing, type FileRouter } from "uploadthing/next";
import { generateReactHelpers } from "@uploadthing/react";
import { z } from "zod";

const f = createUploadthing();

const auth = (req: Request) => ({ id: "test" }); // Replace with actual auth

export const ourFileRouter = {
  profileImage: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .input(
      z.object({
        userId: z.string(),
      })
    )
    .middleware(async ({ input }) => {
      return { userId: input.userId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete for userId:", metadata.userId);
      console.log("File URL:", file.url);
    }),
  workshopRecording: f({ video: { maxFileSize: "512MB", maxFileCount: 1 } })
    .input(
      z.object({
        workshopId: z.string(),
      })
    )
    .middleware(async ({ input }) => {
      return { workshopId: input.workshopId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Workshop recording uploaded:", metadata.workshopId);
      console.log("File URL:", file.url);
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;

export const { useUploadThing, uploadFiles } = generateReactHelpers<OurFileRouter>();
