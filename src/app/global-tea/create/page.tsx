'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Award, MapPin, TrendingUp, MessageCircle } from 'lucide-react';

const teaTypes = [
  { value: 'BEAUTY_WISDOM', label: 'Beauty Wisdom', icon: Award },
  { value: 'TRENDING', label: 'Trending', icon: TrendingUp },
  { value: 'COMMUNITY_SPOTLIGHT', label: 'Community Spotlight', icon: MessageCircle },
  { value: 'LOCAL_TEA', label: 'Local Tea', icon: MapPin },
] as const;

type TeaType = typeof teaTypes[number]['value'];

interface FormData {
  title: string;
  content: string;
  type: TeaType | '';
  image: string;
  tags: string;
}

export default function CreateGlobalTeaPost() {
  const router = useRouter();
  const { data: session } = useSession();
  const { toast } = useToast();

  const [formData, setFormData] = useState<FormData>({
    title: '',
    content: '',
    type: '',
    image: '',
    tags: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      const response = await fetch('/api/global-tea', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to create post');
      }

      toast({
        title: 'Success',
        description: 'Your post has been created successfully.',
      });

      router.push('/global-tea');
      router.refresh();
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: 'Error',
        description: 'Failed to create post. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTypeDescription = (type: TeaType) => {
    switch (type) {
      case 'BEAUTY_WISDOM':
        return 'Share your beauty tips, tricks, and knowledge with the community.';
      case 'TRENDING':
        return 'Share what\'s hot and trending in the beauty world right now.';
      case 'COMMUNITY_SPOTLIGHT':
        return 'Highlight community members, success stories, and inspiring journeys.';
      case 'LOCAL_TEA':
        return 'Share beauty insights and recommendations specific to your local area.';
      default:
        return '';
    }
  };

  if (!session?.user) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground">
            Please sign in to create a post.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto px-4 py-8">
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="type">Post Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value: TeaType) =>
                setFormData((prev) => ({ ...prev, type: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select post type" />
              </SelectTrigger>
              <SelectContent>
                {teaTypes.map(({ value, label, icon: Icon }) => (
                  <SelectItem key={value} value={value}>
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formData.type && (
              <p className="mt-2 text-sm text-muted-foreground">
                {getTypeDescription(formData.type as TeaType)}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="Enter a descriptive title"
            />
          </div>

          <div>
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, content: e.target.value }))
              }
              placeholder="Share your thoughts..."
              rows={5}
            />
          </div>

          <div>
            <Label htmlFor="image">Image URL (optional)</Label>
            <Input
              id="image"
              value={formData.image}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, image: e.target.value }))
              }
              placeholder="Enter image URL"
            />
          </div>

          <div>
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, tags: e.target.value }))
              }
              placeholder="beauty, skincare, tips"
            />
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Post'}
          </Button>
        </form>
      </Card>
    </div>
  );
} 