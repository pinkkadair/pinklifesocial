import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lock, SparklesIcon, ActivityIcon, CrownIcon, CalendarIcon, BotIcon, HistoryIcon, CreditCardIcon, TicketIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import SmartMirror from "./SmartMirror";
import BeautyRiskAssessment from "./BeautyRiskAssessment";
import AndiVirtualEsthetician from "./AndiVirtualEsthetician";
import { useState, useCallback } from "react";
import { RiskFactorType, RiskSeverity } from '@prisma/client';
import { logger } from '@/lib/logger';

interface VIPSectionProps {
  isVIP: boolean;
  isPinkU: boolean;
  onAnalysisComplete: (result: {
    type: RiskFactorType;
    severity: RiskSeverity;
    description: string;
    recommendation?: string;
  }) => void;
}

export function VIPSection({ isVIP, isPinkU, onAnalysisComplete }: VIPSectionProps) {
  const [showAssessment, setShowAssessment] = useState(false);
  const [isUpdated, setIsUpdated] = useState(false);

  // Mock data - replace with real data from your backend
  const bankedServices = [
    { name: "Facial Treatment", credits: 2 },
    { name: "Consultation", credits: 1 },
  ];

  const treatmentHistory = [
    { date: "2024-03-15", treatment: "Hydrafacial", provider: "Dr. Smith" },
    { date: "2024-02-28", treatment: "Skin Analysis", provider: "Dr. Johnson" },
  ];

  const handleStartAnalysis = useCallback(() => {
    setShowAssessment(true);
  }, []);

  const handleAnalysisComplete = useCallback((results: Array<{
    type: RiskFactorType;
    severity: RiskSeverity;
    description: string;
    recommendation?: string;
  }>) => {
    // Pass the first result to the parent component
    if (results.length > 0) {
      onAnalysisComplete(results[0]);
    }
    setIsUpdated(true);
  }, [onAnalysisComplete]);

  const handleSmartMirrorAnalysisComplete = useCallback((result: {
    type: RiskFactorType;
    severity: RiskSeverity;
    description: string;
    recommendation?: string;
  }) => {
    onAnalysisComplete(result);
    setIsUpdated(true);
  }, [onAnalysisComplete]);

  const handleAnalysisEnd = useCallback(() => {
    setShowAssessment(false);
  }, []);

  const handleClose = useCallback((updated: boolean) => {
    setShowAssessment(false);
    if (updated) {
      setIsUpdated(true);
    }
  }, []);

  if (!isVIP && !isPinkU) {
    return (
      <Card className="p-4">
        <CardContent>
          <h3 className="text-lg font-semibold mb-2">Upgrade to VIP</h3>
          <p className="text-muted-foreground mb-4">
            Get access to exclusive features and personalized beauty assessments.
          </p>
          <Button className="w-full">Upgrade Now</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <CardContent>
          <h3 className="text-lg font-semibold mb-2">Beauty Risk Assessment</h3>
          <p className="text-muted-foreground mb-4">
            Get a personalized assessment of your beauty risks and receive tailored recommendations.
          </p>
          <Button onClick={() => setShowAssessment(true)} disabled={showAssessment}>
            {isUpdated ? 'Update Assessment' : 'Start Assessment'}
          </Button>
        </CardContent>
      </Card>

      {isVIP && (
        <Card className="p-4">
          <CardContent>
            <h3 className="text-lg font-semibold mb-2">Smart Mirror</h3>
            <p className="text-muted-foreground mb-4">
              Use our AI-powered smart mirror for real-time skin analysis.
            </p>
            <SmartMirror isVIP={isVIP} onAnalysisComplete={handleSmartMirrorAnalysisComplete} />
          </CardContent>
        </Card>
      )}

      <BeautyRiskAssessment
        open={showAssessment}
        onClose={handleClose}
        onComplete={() => setShowAssessment(false)}
        onStartAnalysis={handleStartAnalysis}
        onAnalysisComplete={handleAnalysisComplete}
        onAnalysisEnd={handleAnalysisEnd}
      />
    </div>
  );
} 