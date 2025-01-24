'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from "@/components/ui/progress";
import { Sparkles, TrendingUp, TrendingDown } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Import SkinAnalysis component with no SSR
const SkinAnalysis = dynamic(() => import('./SkinAnalysis'), {
  ssr: false,
});

interface SkinMetric {
  name: string;
  value: number;
  description: string;
}

interface HistoricalMetric extends SkinMetric {
  date: string;
}

const defaultMetrics: SkinMetric[] = [
  { name: "Hydration", value: 75, description: "Skin moisture level" },
  { name: "Elasticity", value: 82, description: "Skin firmness and bounce" },
  { name: "Texture", value: 68, description: "Skin surface smoothness" },
  { name: "Pores", value: 70, description: "Pore size and visibility" },
  { name: "Wrinkles", value: 85, description: "Fine lines and wrinkles" },
  { name: "Spots", value: 78, description: "Pigmentation and dark spots" },
];

interface SmartMirrorProps {
  isVIP: boolean;
}

export default function SmartMirror({ isVIP }: SmartMirrorProps) {
  const [metrics, setMetrics] = useState<SkinMetric[]>(defaultMetrics);
  const [history, setHistory] = useState<HistoricalMetric[][]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Load historical data
  React.useEffect(() => {
    const storedHistory = localStorage.getItem('skinAnalysisHistory');
    if (storedHistory) {
      setHistory(JSON.parse(storedHistory));
    }
  }, []);

  const handleAnalysisComplete = (newMetrics: SkinMetric[]) => {
    setMetrics(newMetrics);
    setLastUpdated(new Date());
  };

  const handleStartAnalysis = () => {
    setIsAnalyzing(true);
    setMetrics([]);
  };

  const handleAnalysisEnd = () => {
    setIsAnalyzing(false);
  };

  const getMetricTrend = (metricName: string): { trend: number; icon: JSX.Element } => {
    if (history.length < 2) return { trend: 0, icon: <TrendingUp className="w-4 h-4 text-gray-400" /> };

    const lastTwo = history.slice(-2);
    const previousValue = lastTwo[0].find(m => m.name === metricName)?.value || 0;
    const currentValue = lastTwo[1].find(m => m.name === metricName)?.value || 0;
    const trend = currentValue - previousValue;

    return {
      trend,
      icon: trend >= 0 ? (
        <TrendingUp className="w-4 h-4 text-green-500" />
      ) : (
        <TrendingDown className="w-4 h-4 text-red-500" />
      ),
    };
  };

  if (!isVIP) {
    return null;
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-pink-500" />
          Smart Mirror
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <SkinAnalysis
              onAnalysisComplete={handleAnalysisComplete}
              onStartAnalysis={handleStartAnalysis}
              onAnalysisEnd={handleAnalysisEnd}
            />
            <span className="text-sm text-muted-foreground">
              Last updated: {lastUpdated.toLocaleDateString()}
            </span>
          </div>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="metrics">
              <AccordionTrigger>Skin Metrics</AccordionTrigger>
              <AccordionContent>
                <div className="grid gap-4 pt-4">
                  {metrics.map((metric) => {
                    const { trend, icon } = getMetricTrend(metric.name);
                    return (
                      <div key={metric.name} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{metric.name}</p>
                              {icon}
                              {trend !== 0 && (
                                <span className={`text-xs ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                  {trend > 0 ? '+' : ''}{trend}%
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {metric.description}
                            </p>
                          </div>
                          <span className="font-bold">{metric.value}%</span>
                        </div>
                        <Progress value={metric.value} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="history">
              <AccordionTrigger>History</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  {history.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No historical data available yet. Complete your first analysis to start tracking progress.
                    </p>
                  ) : (
                    history.map((metrics, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium">
                            {new Date(metrics[0].date).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          {metrics.map((metric) => (
                            <div key={metric.name} className="text-sm">
                              <span className="font-medium">{metric.name}:</span>{' '}
                              <span className="text-muted-foreground">{metric.value}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )).reverse()
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="recommendations">
              <AccordionTrigger>Recommendations</AccordionTrigger>
              <AccordionContent>
                <div className="bg-muted p-4 rounded-lg mt-4">
                  <ul className="text-sm space-y-2">
                    {metrics.some(m => m.name === "Hydration" && m.value < 70) && (
                      <li>• Focus on hydration with hyaluronic acid products</li>
                    )}
                    {metrics.some(m => m.name === "Texture" && m.value < 75) && (
                      <li>• Consider adding retinol for texture improvement</li>
                    )}
                    {metrics.some(m => m.name === "Spots" && m.value < 80) && (
                      <li>• Use vitamin C serum for pigmentation</li>
                    )}
                    <li>• Use broad-spectrum SPF daily</li>
                    <li>• Book a consultation for personalized treatment plan</li>
                  </ul>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </CardContent>
    </Card>
  );
} 