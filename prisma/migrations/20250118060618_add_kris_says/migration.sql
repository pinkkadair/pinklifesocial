-- CreateEnum
CREATE TYPE "QuestionStatus" AS ENUM ('PENDING', 'ANSWERED', 'FEATURED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "KrisQuestion" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" "QuestionStatus" NOT NULL DEFAULT 'PENDING',
    "language" TEXT NOT NULL DEFAULT 'en',
    "categoryId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KrisQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KrisAnswer" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KrisAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KrisCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KrisCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "KrisQuestion_authorId_status_idx" ON "KrisQuestion"("authorId", "status");

-- CreateIndex
CREATE INDEX "KrisQuestion_categoryId_idx" ON "KrisQuestion"("categoryId");

-- CreateIndex
CREATE INDEX "KrisAnswer_questionId_idx" ON "KrisAnswer"("questionId");

-- CreateIndex
CREATE INDEX "KrisAnswer_authorId_idx" ON "KrisAnswer"("authorId");

-- CreateIndex
CREATE UNIQUE INDEX "KrisCategory_name_key" ON "KrisCategory"("name");

-- AddForeignKey
ALTER TABLE "KrisQuestion" ADD CONSTRAINT "KrisQuestion_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KrisQuestion" ADD CONSTRAINT "KrisQuestion_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "KrisCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KrisAnswer" ADD CONSTRAINT "KrisAnswer_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KrisAnswer" ADD CONSTRAINT "KrisAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "KrisQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
