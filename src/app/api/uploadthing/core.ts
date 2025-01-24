import { createUploadthing, type FileRouter } from "uploadthing/next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

const f = createUploadthing();

const handleAuth = async () => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    throw new Error("Unauthorized");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) {
    throw new Error("User not found");
  }

  return { userId: user.id };
};

export const ourFileRouter = {
  profileImage: f({
    image: { 
      maxFileSize: "4MB",
      maxFileCount: 1,
    }
  })
    .middleware(async () => {
      try {
        return await handleAuth();
      } catch (error) {
        logger.error("Error in upload middleware:", error);
        throw error;
      }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      try {
        logger.info("Starting file upload completion", { fileUrl: file.url });
        
        if (!file.url) {
          logger.error("No file URL in upload response");
          throw new Error("No file URL received");
        }

        // First verify the user still exists
        const user = await prisma.user.findUnique({
          where: { id: metadata.userId },
          select: { id: true }
        });

        if (!user) {
          logger.error("User not found during image update", { userId: metadata.userId });
          throw new Error("User not found");
        }

        // Update the user's image
        const updatedUser = await prisma.user.update({
          where: { id: metadata.userId },
          data: { 
            image: file.url,
            updatedAt: new Date() // Force an update to the timestamp
          },
          select: { id: true, image: true }
        });
        
        logger.info("User image updated successfully", { 
          userId: updatedUser.id,
          imageUrl: updatedUser.image 
        });
        
        if (!updatedUser.image) {
          logger.error("Image URL not saved in database");
          throw new Error("Failed to update profile image");
        }
        
        // Verify the update was successful
        const verifiedUser = await prisma.user.findUnique({
          where: { id: metadata.userId },
          select: { image: true }
        });

        if (verifiedUser?.image !== file.url) {
          logger.error("Image URL verification failed", {
            expected: file.url,
            actual: verifiedUser?.image
          });
          throw new Error("Failed to verify image update");
        }
        
        return { url: file.url };
      } catch (error) {
        logger.error("Error updating user image:", error);
        throw error;
      }
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
