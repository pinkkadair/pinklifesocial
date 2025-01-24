'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from "@/components/ui/progress";
import { Sparkles, TrendingUp, TrendingDown, Camera, History, LineChart } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SkinAnalysisResult } from '@/lib/skin-analysis';

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

interface SmartMirrorProps {
  isVIP: boolean;
}

export default function SmartMirror({ isVIP }: SmartMirrorProps) {
  const [metrics, setMetrics] = useState<SkinMetric[]>([]);
  const [history, setHistory] = useState<HistoricalMetric[][]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState('analysis');

  // Load historical data
  useEffect(() => {
    const storedHistory = localStorage.getItem('skinAnalysisHistory');
    if (storedHistory) {
      setHistory(JSON.parse(storedHistory));
    }
    
    const lastAnalysis = localStorage.getItem('lastSkinAnalysis');
    if (lastAnalysis) {
      const { metrics, date } = JSON.parse(lastAnalysis);
      setMetrics(metrics);
      setLastUpdated(new Date(date));
    }
  }, []);

  const handleAnalysisComplete = (newMetrics: SkinMetric[]) => {
    setMetrics(newMetrics);
    const now = new Date();
    setLastUpdated(now);

    // Save current analysis
    localStorage.setItem('lastSkinAnalysis', JSON.stringify({
      metrics: newMetrics,
      date: now.toISOString(),
    }));

    // Update history
    const historicalMetrics = newMetrics.map(metric => ({
      ...metric,
      date: now.toISOString(),
    }));
    const newHistory = [...history, historicalMetrics];
    setHistory(newHistory);
    localStorage.setItem('skinAnalysisHistory', JSON.stringify(newHistory));
  };

  const handleStartAnalysis = () => {
    setIsAnalyzing(true);
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

  const getRecommendations = (metrics: SkinMetric[]): string[] => {
    const recommendations: string[] = [];

    metrics.forEach(metric => {
      if (metric.value < 70) {
        switch (metric.name) {
          case 'Hydration':
            recommendations.push('Increase hydration with hyaluronic acid and ceramides');
            break;
          case 'Elasticity':
            recommendations.push('Use peptides and retinol to improve skin firmness');
            break;
          case 'Texture':
            recommendations.push('Consider gentle exfoliation with AHA/BHA');
            break;
          case 'Pores':
            recommendations.push('Use niacinamide to minimize pore appearance');
            break;
          case 'Wrinkles':
            recommendations.push('Add retinol and peptides to your routine');
            break;
          case 'Spots':
            recommendations.push('Use vitamin C and sunscreen for pigmentation');
            break;
          case 'Uniformity':
            recommendations.push('Consider azelaic acid for evening skin tone');
            break;
          case 'Brightness':
            recommendations.push('Add vitamin C for increased radiance');
            break;
        }
      }
    });

    if (recommendations.length === 0) {
      recommendations.push('Continue with your current skincare routine');
      recommendations.push('Maintain sun protection and hydration');
    }

    return recommendations;
  };

  if (!isVIP) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-pink-500" />
            Smart Mirror
          </CardTitle>
          <CardDescription>
            Upgrade to VIP to access advanced skin analysis features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" variant="premium">
            Upgrade to VIP
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-pink-500" />
          Smart Mirror
        </CardTitle>
        {lastUpdated && (
          <CardDescription>
            Last analyzed: {lastUpdated.toLocaleDateString()} {lastUpdated.toLocaleTimeString()}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="analysis" className="flex items-center gap-2">
              <Camera className="w-4 h-4" />
              Analysis
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              History
            </TabsTrigger>
            <TabsTrigger value="trends" className="flex items-center gap-2">
              <LineChart className="w-4 h-4" />
              Trends
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analysis" className="space-y-4">
            {!isAnalyzing && metrics.length === 0 ? (
              <SkinAnalysis
                onAnalysisComplete={handleAnalysisComplete}
                onStartAnalysis={handleStartAnalysis}
                onAnalysisEnd={handleAnalysisEnd}
              />
            ) : (
              <div className="space-y-6">
                <div className="grid gap-4">
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
                                  {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {metric.description}
                            </p>
                          </div>
                          <Badge variant={metric.value >= 70 ? "success" : "warning"}>
                            {metric.value.toFixed(1)}%
                          </Badge>
                        </div>
                        <Progress 
                          value={metric.value} 
                          className="h-2"
                          indicatorClassName={metric.value >= 70 ? "bg-green-500" : "bg-yellow-500"}
                        />
                      </div>
                    );
                  })}
                </div>

                {metrics.length > 0 && (
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="recommendations">
                      <AccordionTrigger>Recommendations</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2">
                          {getRecommendations(metrics).map((rec, index) => (
                            <p key={index} className="text-sm flex items-start gap-2">
                              <span className="text-pink-500">•</span>
                              {rec}
                            </p>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                )}

                {!isAnalyzing && (
                  <Button 
                    onClick={() => {
                      setMetrics([]);
                      setActiveTab('analysis');
                    }}
                    className="w-full"
                  >
                    New Analysis
                  </Button>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            {history.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No historical data available yet.</p>
                <p className="text-sm">Complete your first analysis to start tracking progress.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {history.slice().reverse().map((metrics, index) => (
                  <Card key={index}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">
                        {new Date(metrics[0].date).toLocaleDateString()}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        {metrics.map((metric) => (
                          <div key={metric.name} className="text-sm">
                            <span className="font-medium">{metric.name}:</span>{' '}
                            <span className="text-muted-foreground">{metric.value.toFixed(1)}%</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="trends" className="space-y-4">
            {history.length < 2 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Not enough data to show trends.</p>
                <p className="text-sm">Complete multiple analyses to track changes over time.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {metrics.map((metric) => {
                  const { trend } = getMetricTrend(metric.name);
                  const trendData = history.map(h => ({
                    date: new Date(h[0].date).toLocaleDateString(),
                    value: h.find(m => m.name === metric.name)?.value || 0,
                  }));

                  return (
                    <div key={metric.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">{metric.name}</h3>
                        <span className={`text-sm ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-24 w-full">
                        {/* Add chart visualization here */}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 