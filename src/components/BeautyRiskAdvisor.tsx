"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AlertTriangleIcon, ShieldCheckIcon, InfoIcon } from "lucide-react";
import { getBeautyRiskAssessment } from "@/actions/beauty-risk.action";
import { Skeleton } from "@/components/ui/skeleton";
import { BeautyRiskAssessment } from "@/components/BeautyRiskAssessment";
import { useRouter } from "next/navigation";
import { RiskFactorType, RiskSeverity } from "@prisma/client";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface BeautyRiskAdvisorProps {
  userId: string;
}

export function BeautyRiskAdvisor({ userId }: BeautyRiskAdvisorProps) {
  const router = useRouter();
  const [isAssessmentOpen, setIsAssessmentOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [assessment, setAssessment] = useState<{
    riskScore: number;
    factors: {
      type: RiskFactorType;
      severity: RiskSeverity;
      description: string;
    }[];
  } | null>(null);

  useEffect(() => {
    const loadAssessment = async () => {
      const result = await getBeautyRiskAssessment(userId);
      if (result) {
        setAssessment(result);
      }
    };
    loadAssessment();
  }, [userId]);

  const handleStartAnalysis = () => {
    setIsAnalyzing(true);
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 500);
  };

  const handleAnalysisComplete = (factors: {
    type: RiskFactorType;
    severity: RiskSeverity;
    description: string;
  }[]) => {
    setAssessment({
      riskScore: 100 - factors.reduce((acc, factor) => {
        const severityScore = {
          [RiskSeverity.LOW]: 5,
          [RiskSeverity.MEDIUM]: 10,
          [RiskSeverity.HIGH]: 15,
          [RiskSeverity.CRITICAL]: 25,
        }[factor.severity];
        return acc + severityScore;
      }, 0),
      factors,
    });
    setIsAnalyzing(false);
    setProgress(100);
  };

  const handleAnalysisEnd = () => {
    setIsAnalyzing(false);
    setProgress(0);
  };

  const getRiskColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  const getSeverityColor = (severity: RiskSeverity) => {
    switch (severity) {
      case "LOW":
        return "bg-green-100 text-green-700";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-700";
      case "HIGH":
        return "bg-orange-100 text-orange-700";
      case "CRITICAL":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  if (!assessment) {
    return (
      <div className="space-y-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Beauty Risk Assessment</h2>
              <p className="text-gray-500">
                {assessment
                  ? "View your latest beauty risk assessment"
                  : "Take a beauty risk assessment to get personalized recommendations"}
              </p>
            </div>
            <Button onClick={() => setIsAssessmentOpen(true)}>
              {assessment ? "Update Assessment" : "Start Assessment"}
            </Button>
          </div>
        </Card>

        <BeautyRiskAssessment
          open={isAssessmentOpen}
          onClose={() => setIsAssessmentOpen(false)}
          onComplete={() => {
            setIsAssessmentOpen(false);
            router.refresh();
          }}
          onStartAnalysis={handleStartAnalysis}
          onAnalysisComplete={handleAnalysisComplete}
          onAnalysisEnd={handleAnalysisEnd}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Beauty Risk Assessment</h2>
            <p className="text-gray-500">
              {assessment
                ? "View your latest beauty risk assessment"
                : "Take a beauty risk assessment to get personalized recommendations"}
            </p>
          </div>
          <Button onClick={() => setIsAssessmentOpen(true)}>
            {assessment ? "Update Assessment" : "Start Assessment"}
          </Button>
        </div>

        {assessment && (
          <div className="mt-6">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Risk Score</span>
                  <span className="text-sm font-medium">{assessment.riskScore}%</span>
                </div>
                <Progress value={assessment.riskScore} />
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4">Risk Factors</h3>
              <div className="space-y-4">
                {assessment.factors.map((factor, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{factor.type}</span>
                        <span
                          className={`text-sm font-medium ${
                            factor.severity === "HIGH" || factor.severity === "CRITICAL"
                              ? "text-red-500"
                              : factor.severity === "MEDIUM"
                              ? "text-yellow-500"
                              : "text-green-500"
                          }`}
                        >
                          {factor.severity}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{factor.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Card>

      <BeautyRiskAssessment
        open={isAssessmentOpen}
        onClose={() => setIsAssessmentOpen(false)}
        onComplete={() => {
          setIsAssessmentOpen(false);
          router.refresh();
        }}
        onStartAnalysis={handleStartAnalysis}
        onAnalysisComplete={handleAnalysisComplete}
        onAnalysisEnd={handleAnalysisEnd}
      />
    </div>
  );
}

export default BeautyRiskAdvisor; 