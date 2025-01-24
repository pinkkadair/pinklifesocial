"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AskQuestion from "./AskQuestion";
import QuestionsList from "./QuestionsList";
import FeaturedQuestions from "./FeaturedQuestions";

export default function KrisSaysClient() {
  const [activeTab, setActiveTab] = useState("featured");

  return (
    <Tabs defaultValue="featured" className="w-full" onValueChange={setActiveTab}>
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="featured">Featured</TabsTrigger>
        <TabsTrigger value="ask">Ask Kris</TabsTrigger>
        <TabsTrigger value="browse">Browse Questions</TabsTrigger>
      </TabsList>
      
      <TabsContent value="featured" className="mt-6">
        <FeaturedQuestions />
      </TabsContent>
      
      <TabsContent value="ask" className="mt-6">
        <AskQuestion />
      </TabsContent>
      
      <TabsContent value="browse" className="mt-6">
        <QuestionsList />
      </TabsContent>
    </Tabs>
  );
} 