"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { getFeaturedQuestions } from "@/actions/kris-says.action";
import { toast } from "react-hot-toast";

type FeaturedQuestion = {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  author: {
    name: string | null;
    username: string;
    image: string | null;
  };
  answers: {
    id: string;
    content: string;
    createdAt: Date;
    author: {
      name: string | null;
      username: string;
      image: string | null;
    };
  }[];
  category: {
    name: string;
  };
};

export default function FeaturedQuestions() {
  const [featuredQuestions, setFeaturedQuestions] = useState<FeaturedQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadFeaturedQuestions = async () => {
      try {
        const data = await getFeaturedQuestions();
        setFeaturedQuestions(data);
      } catch (error) {
        toast.error("Failed to load featured questions");
      } finally {
        setIsLoading(false);
      }
    };

    loadFeaturedQuestions();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/4 mt-2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full mt-2" />
              <Skeleton className="h-20 w-full mt-4" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (featuredQuestions.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          No featured questions yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {featuredQuestions.map((question) => (
        <Card key={question.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold">{question.title}</CardTitle>
              <span className="text-sm text-muted-foreground">{question.category.name}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Avatar className="h-6 w-6">
                <AvatarImage src={question.author.image ?? "/avatar.png"} />
              </Avatar>
              <span>{question.author.name ?? question.author.username}</span>
              <span>•</span>
              <span>
                {formatDistanceToNow(new Date(question.createdAt), { addSuffix: true })}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{question.content}</p>

            {question.answers.map((answer) => (
              <div key={answer.id} className="pl-4 border-l-2 border-primary mt-4">
                <div className="flex items-center gap-2 text-sm">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={answer.author.image ?? "/avatar.png"} />
                  </Avatar>
                  <span className="font-medium">
                    {answer.author.name ?? answer.author.username}
                  </span>
                  <span className="text-muted-foreground">
                    {formatDistanceToNow(new Date(answer.createdAt), { addSuffix: true })}
                  </span>
                </div>
                <p className="mt-2">{answer.content}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 