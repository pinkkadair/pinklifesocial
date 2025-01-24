-- CreateEnum
CREATE TYPE "TeaType" AS ENUM ('BEAUTY_WISDOM', 'DRAMA', 'NEWS', 'LOCAL_TEA', 'GLOBAL_TEA');

-- CreateTable
CREATE TABLE "GlobalTeaPost" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" "TeaType" NOT NULL,
    "region" TEXT,
    "authorId" TEXT NOT NULL,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GlobalTeaPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GlobalTeaComment" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GlobalTeaComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GlobalTeaTag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GlobalTeaTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_GlobalTeaPostToGlobalTeaTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_GlobalTeaPostToGlobalTeaTag_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "GlobalTeaPost_authorId_idx" ON "GlobalTeaPost"("authorId");

-- CreateIndex
CREATE INDEX "GlobalTeaPost_type_idx" ON "GlobalTeaPost"("type");

-- CreateIndex
CREATE INDEX "GlobalTeaComment_authorId_postId_idx" ON "GlobalTeaComment"("authorId", "postId");

-- CreateIndex
CREATE UNIQUE INDEX "GlobalTeaTag_name_key" ON "GlobalTeaTag"("name");

-- CreateIndex
CREATE INDEX "_GlobalTeaPostToGlobalTeaTag_B_index" ON "_GlobalTeaPostToGlobalTeaTag"("B");

-- RenameForeignKey
ALTER TABLE "Like" RENAME CONSTRAINT "Like_postId_fkey" TO "Like_postId_post_fkey";

-- AddForeignKey
ALTER TABLE "Like" ADD CONSTRAINT "Like_postId_globalTeaPost_fkey" FOREIGN KEY ("postId") REFERENCES "GlobalTeaPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GlobalTeaPost" ADD CONSTRAINT "GlobalTeaPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GlobalTeaComment" ADD CONSTRAINT "GlobalTeaComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GlobalTeaComment" ADD CONSTRAINT "GlobalTeaComment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "GlobalTeaPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GlobalTeaPostToGlobalTeaTag" ADD CONSTRAINT "_GlobalTeaPostToGlobalTeaTag_A_fkey" FOREIGN KEY ("A") REFERENCES "GlobalTeaPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GlobalTeaPostToGlobalTeaTag" ADD CONSTRAINT "_GlobalTeaPostToGlobalTeaTag_B_fkey" FOREIGN KEY ("B") REFERENCES "GlobalTeaTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
