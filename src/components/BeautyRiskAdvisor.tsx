"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AlertTriangleIcon, ShieldCheckIcon, InfoIcon } from "lucide-react";
import { getBeautyRisk } from "@/actions/beauty-risk.action";
import { Skeleton } from "@/components/ui/skeleton";
import BeautyRiskAssessment from "./BeautyRiskAssessment";
import { useRouter } from "next/navigation";
import { RiskFactorType, RiskSeverity } from "@prisma/client";
import { Dialog, DialogContent } from "@/components/ui/dialog";

type BeautyRisk = {
  id: string;
  riskScore: number;
  lastUpdated: Date;
  factors: {
    id: string;
    type: RiskFactorType;
    severity: RiskSeverity;
    description: string;
    recommendation?: string | null;
  }[];
};

interface BeautyRiskAdvisorProps {
  beautyRisk: BeautyRisk | null;
}

function BeautyRiskAdvisor({ beautyRisk }: BeautyRiskAdvisorProps) {
  const router = useRouter();
  const [showAssessment, setShowAssessment] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleStartAssessment = () => {
    setShowAssessment(true);
  };

  const handleCloseAssessment = () => {
    setShowAssessment(false);
    router.refresh();
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

  if (!beautyRisk) {
    return (
      <>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangleIcon className="w-5 h-5 text-yellow-500" />
              Beauty Risk Assessment
            </CardTitle>
            <CardDescription className="flex items-center gap-2 text-yellow-600">
              <InfoIcon className="w-4 h-4" />
              Free trial available for 7 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Complete your beauty risk assessment to receive personalized recommendations and track your progress.
            </p>
            <Button 
              onClick={handleStartAssessment}
              disabled={isLoading}
            >
              Start Assessment
            </Button>
          </CardContent>
        </Card>

        <Dialog open={showAssessment} onOpenChange={setShowAssessment}>
          <DialogContent className="sm:max-w-[600px]">
            <BeautyRiskAssessment onComplete={handleCloseAssessment} />
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheckIcon className="w-5 h-5 text-green-500" />
            Beauty Risk Score
          </CardTitle>
          <CardDescription className="flex items-center gap-2 text-yellow-600">
            <InfoIcon className="w-4 h-4" />
            Free trial expires in 7 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Overall Risk Score</span>
                <span className={`font-bold ${getRiskColor(beautyRisk.riskScore)}`}>
                  {beautyRisk.riskScore}%
                </span>
              </div>
              <Progress value={beautyRisk.riskScore} className="h-2" />
            </div>

            <div className="space-y-4">
              {beautyRisk.factors.map((factor) => (
                <div key={factor.id} className="p-4 rounded-lg bg-card">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium">{factor.type.replace(/_/g, ' ')}</h4>
                      <p className="text-sm text-muted-foreground">{factor.description}</p>
                      {factor.recommendation && (
                        <p className="text-sm text-green-600 mt-2">
                          Recommendation: {factor.recommendation}
                        </p>
                      )}
                    </div>
                    <Badge className={getSeverityColor(factor.severity)}>
                      {factor.severity}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>

            <Button 
              onClick={handleStartAssessment}
              variant="outline"
              className="w-full mt-4"
            >
              Retake Assessment
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showAssessment} onOpenChange={setShowAssessment}>
        <DialogContent className="sm:max-w-[600px]">
          <BeautyRiskAssessment onComplete={handleCloseAssessment} />
        </DialogContent>
      </Dialog>
    </>
  );
}

export default BeautyRiskAdvisor; 