"use server";

import { prisma } from "@/lib/prisma";
import { getDbUserId } from "./user.action";
import { revalidatePath } from "next/cache";

export async function createQuestion(data: {
  title: string;
  content: string;
  categoryId: string;
  language: string;
}) {
  const authorId = await getDbUserId();
  
  if (!authorId) {
    throw new Error("User not authenticated");
  }

  const question = await prisma.krisQuestion.create({
    data: {
      ...data,
      authorId,
    },
  });

  revalidatePath("/kris-says");
  return question;
}

export async function getFeaturedQuestions() {
  return prisma.krisQuestion.findMany({
    where: {
      status: "FEATURED",
    },
    include: {
      author: {
        select: {
          name: true,
          username: true,
          image: true,
        },
      },
      category: {
        select: {
          name: true,
        },
      },
      answers: {
        include: {
          author: {
            select: {
              name: true,
              username: true,
              image: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 5,
  });
}

export async function getQuestions(params?: {
  status?: "PENDING" | "ANSWERED" | "FEATURED" | "ARCHIVED";
  categoryId?: string;
}) {
  return prisma.krisQuestion.findMany({
    where: {
      ...params,
    },
    include: {
      author: {
        select: {
          name: true,
          username: true,
          image: true,
        },
      },
      category: {
        select: {
          name: true,
        },
      },
      _count: {
        select: {
          answers: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function createAnswer(data: {
  content: string;
  questionId: string;
  language: string;
}) {
  const authorId = await getDbUserId();
  
  if (!authorId) {
    throw new Error("User not authenticated");
  }

  const answer = await prisma.krisAnswer.create({
    data: {
      ...data,
      authorId,
    },
  });

  // Update question status to ANSWERED
  await prisma.krisQuestion.update({
    where: {
      id: data.questionId,
    },
    data: {
      status: "ANSWERED",
    },
  });

  revalidatePath("/kris-says");
  return answer;
}

export async function getCategories() {
  return prisma.krisCategory.findMany({
    orderBy: {
      name: "asc",
    },
  });
} 