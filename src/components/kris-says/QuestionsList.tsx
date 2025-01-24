"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { getQuestions } from "@/actions/kris-says.action";
import { toast } from "react-hot-toast";

type Question = {
  id: string;
  title: string;
  content: string;
  status: "PENDING" | "ANSWERED" | "FEATURED" | "ARCHIVED";
  createdAt: Date;
  author: {
    name: string | null;
    username: string;
    image: string | null;
  };
  category: {
    name: string;
  };
  _count: {
    answers: number;
  };
};

export default function QuestionsList() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadQuestions = async () => {
      try {
        const data = await getQuestions();
        setQuestions(data);
      } catch (error) {
        toast.error("Failed to load questions");
      } finally {
        setIsLoading(false);
      }
    };

    loadQuestions();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/4 mt-2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          No questions found.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {questions.map((question) => (
        <Card key={question.id} className="hover:bg-muted/50 transition-colors">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">{question.title}</CardTitle>
              <Badge variant={question.status === "ANSWERED" ? "default" : "secondary"}>
                {question.status.toLowerCase()}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>by {question.author.name ?? question.author.username}</span>
              <span>•</span>
              <span>{formatDistanceToNow(new Date(question.createdAt), { addSuffix: true })}</span>
              <span>•</span>
              <span>{question.category.name}</span>
              <span>•</span>
              <span>{question._count.answers} answers</span>
            </div>
          </CardHeader>
          <CardContent>
            <p className="line-clamp-2 text-muted-foreground">{question.content}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 