import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const VALID_TEA_TYPES = ['BEAUTY_WISDOM', 'TRENDING', 'COMMUNITY_SPOTLIGHT', 'LOCAL_TEA', 'SPILL'] as const;
type TeaType = typeof VALID_TEA_TYPES[number];

const postSchema = z.object({
  content: z.string().min(1),
  type: z.enum(VALID_TEA_TYPES),
  image: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as TeaType | null;
    const cursor = searchParams.get('cursor');
    const limit = 10;

    const posts = await prisma.globalTeaPost.findMany({
      take: limit,
      ...(cursor && {
        skip: 1,
        cursor: {
          id: cursor,
        },
      }),
      ...(type && {
        where: {
          type,
        },
      }),
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            image: true,
          },
        },
        tags: true,
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
      },
    });

    const nextCursor = posts.length === limit ? posts[posts.length - 1].id : null;

    logger.info({
      event: 'global_tea_posts_fetched',
      count: posts.length,
      type,
      cursor,
    });

    return NextResponse.json({
      posts,
      nextCursor,
    });
  } catch (error) {
    logger.error('Failed to fetch global tea posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { content, type, image, tags } = postSchema.parse(body);

    if (!content || !type || !VALID_TEA_TYPES.includes(type)) {
      return NextResponse.json(
        { error: 'Missing required fields or invalid type' },
        { status: 400 }
      );
    }

    // Create post with tags
    const post = await prisma.globalTeaPost.create({
      data: {
        content,
        type,
        image,
        authorId: user.id,
        ...(tags && tags.length > 0 && {
          tags: {
            connectOrCreate: tags.map(tag => ({
              where: { name: tag },
              create: { name: tag },
            })),
          },
        }),
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            image: true,
          },
        },
        tags: true,
      },
    });

    logger.info({
      event: 'global_tea_post_created',
      postId: post.id,
      userId: user.id,
      type,
    });

    return NextResponse.json(post);
  } catch (error) {
    logger.error('Failed to create global tea post:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    );
  }
} 