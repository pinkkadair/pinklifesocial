import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

const VALID_TEA_TYPES = ['BEAUTY_WISDOM', 'TRENDING', 'COMMUNITY_SPOTLIGHT', 'LOCAL_TEA'] as const;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (!type || !VALID_TEA_TYPES.includes(type as any)) {
      return NextResponse.json(
        { error: 'Invalid tea type' },
        { status: 400 }
      );
    }

    let query: any = {
      where: {
        type: type as any,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
            username: true,
          },
        },
        likes: true,
        comments: true,
        tags: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    };

    // Special handling for trending posts
    if (type === 'TRENDING') {
      // Get posts from the last 7 days with most likes and comments
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      query.where = {
        createdAt: {
          gte: sevenDaysAgo,
        },
      };
      query.orderBy = [
        {
          likes: {
            _count: 'desc',
          },
        },
        {
          comments: {
            _count: 'desc',
          },
        },
      ];
    }

    // Special handling for community spotlight
    if (type === 'COMMUNITY_SPOTLIGHT') {
      // Get posts with high engagement and quality content
      query.where = {
        OR: [
          {
            likes: {
              some: {},
            },
          },
          {
            comments: {
              some: {},
            },
          },
        ],
      };
      query.orderBy = [
        {
          likes: {
            _count: 'desc',
          },
        },
        {
          comments: {
            _count: 'desc',
          },
        },
      ];
    }

    // Special handling for local tea
    if (type === 'LOCAL_TEA') {
      // Get posts with region information
      query.where = {
        AND: [
          { type: 'LOCAL_TEA' },
          { region: { not: null } }
        ]
      };
      query.orderBy = {
        createdAt: 'desc'
      };
    }

    const posts = await prisma.globalTeaPost.findMany(query);
    return NextResponse.json(posts);
  } catch (error) {
    console.error('Error in GET /api/global-tea:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const data = await request.json();
    const { title, content, type, image, tags } = data;

    if (!title || !content || !type || !VALID_TEA_TYPES.includes(type)) {
      return NextResponse.json(
        { error: 'Missing required fields or invalid type' },
        { status: 400 }
      );
    }

    const post = await prisma.globalTeaPost.create({
      data: {
        title,
        content,
        type,
        image,
        authorId: user.id,
        tags: {
          create: tags.split(',')
            .map((tag: string) => tag.trim())
            .filter(Boolean)
            .map((tag: string) => ({ name: tag })),
        },
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
            username: true,
          },
        },
        likes: true,
        comments: true,
        tags: true,
      },
    });

    return NextResponse.json(post);
  } catch (error) {
    console.error('Error in POST /api/global-tea:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 