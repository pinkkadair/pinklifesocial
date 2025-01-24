'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { MessageCircle, Heart, Share2, Tag, TrendingUp, Award, MapPin } from 'lucide-react';

interface Post {
  id: string;
  title: string;
  content: string;
  image?: string;
  type: 'BEAUTY_WISDOM' | 'TRENDING' | 'COMMUNITY_SPOTLIGHT' | 'LOCAL_TEA';
  author: {
    id: string;
    name: string;
    image: string;
    username: string;
  };
  likes: any[];
  comments: any[];
  tags: any[];
}

export default function GlobalTeaPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('BEAUTY_WISDOM');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, [activeTab]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/global-tea?type=${activeTab}`);
      if (!response.ok) {
        throw new Error('Failed to fetch posts');
      }
      const data = await response.json();
      setPosts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch posts. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const renderPost = (post: Post) => (
    <Card key={post.id} className="p-6">
      <div className="flex items-center gap-4 mb-4">
        <img
          src={post.author.image}
          alt={post.author.name}
          className="w-10 h-10 rounded-full"
        />
        <div>
          <h3 className="font-semibold">{post.author.name}</h3>
          <p className="text-sm text-muted-foreground">@{post.author.username}</p>
        </div>
      </div>
      <h2 className="text-xl font-semibold mb-2">{post.title}</h2>
      <p className="mb-4">{post.content}</p>
      {post.image && (
        <img
          src={post.image}
          alt={post.title}
          className="w-full rounded-lg mb-4"
        />
      )}
      <div className="flex items-center gap-6 text-sm text-muted-foreground">
        <button className="flex items-center gap-1 hover:text-pink-500 transition-colors">
          <Heart className="h-4 w-4" />
          <span>{post.likes.length}</span>
        </button>
        <button className="flex items-center gap-1 hover:text-pink-500 transition-colors">
          <MessageCircle className="h-4 w-4" />
          <span>{post.comments.length}</span>
        </button>
        <button className="flex items-center gap-1 hover:text-pink-500 transition-colors">
          <Share2 className="h-4 w-4" />
          <span>Share</span>
        </button>
      </div>
      {post.tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <span key={tag.name} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-800">
              <Tag className="h-3 w-3" />
              {tag.name}
            </span>
          ))}
        </div>
      )}
    </Card>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Global Tea</h1>
          <p className="text-muted-foreground mt-2">Share and discover beauty wisdom from around the world</p>
        </div>
        {session?.user && (
          <Button asChild>
            <Link href="/global-tea/create">Create Post</Link>
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="BEAUTY_WISDOM" className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            Beauty Wisdom
          </TabsTrigger>
          <TabsTrigger value="TRENDING" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Trending
          </TabsTrigger>
          <TabsTrigger value="COMMUNITY_SPOTLIGHT" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Community
          </TabsTrigger>
          <TabsTrigger value="LOCAL_TEA" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Local Tea
          </TabsTrigger>
        </TabsList>

        {['BEAUTY_WISDOM', 'TRENDING', 'COMMUNITY_SPOTLIGHT', 'LOCAL_TEA'].map((tabValue) => (
          <TabsContent key={tabValue} value={tabValue}>
            {loading ? (
              <LoadingSpinner />
            ) : posts.length === 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>No posts yet</CardTitle>
                  <CardDescription>
                    Be the first to share your {tabValue.toLowerCase().replace('_', ' ')} with the community!
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {session?.user ? (
                    <Button asChild className="w-full">
                      <Link href="/global-tea/create">Create Post</Link>
                    </Button>
                  ) : (
                    <Button asChild className="w-full">
                      <Link href="/sign-in">Sign in to post</Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {posts.map(renderPost)}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
} 