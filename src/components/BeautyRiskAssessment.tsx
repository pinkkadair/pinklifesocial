"use client";

import React, { useState, useCallback, useEffect, useMemo, Dispatch, SetStateAction } from 'react';
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";
import MembershipDialog from "@/components/MembershipDialog";
import { RiskFactorType, RiskSeverity } from "@prisma/client";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { calculateBeautyRiskAssessment, UserInputs } from "@/lib/beauty-risk-calculator";
import { Progress } from '@/components/ui/progress';
import { CameraIcon, XIcon } from 'lucide-react';
import dynamic from 'next/dynamic';
import { mlManager } from '@/lib/ml-models';
import { logger } from '@/lib/logger';
import { analyzeSkinFeatures } from '@/lib/skin-analysis';
import type { NormalizedFace } from '@tensorflow-models/blazeface';
import type { Tensor1D, Tensor2D } from '@tensorflow/tfjs';
import { SkinAnalysis } from "@/components/SkinAnalysis";
import { Card } from "@/components/ui/card";

const skinTypes = [
  { value: "Oily", label: "Oily" },
  { value: "Dry", label: "Dry" },
  { value: "Combination", label: "Combination" },
  { value: "Sensitive", label: "Sensitive" },
  { value: "Normal", label: "Normal" },
] as const;

const melanationTypes = [
  { value: "None", label: "None (Extremely Fair/Albinism)" },
  { value: "Light", label: "Light" },
  { value: "Medium", label: "Medium" },
  { value: "Dark", label: "Dark" },
  { value: "Very Dark", label: "Very Dark" },
  { value: "Mixed", label: "Mixed" },
] as const;

const skinConcerns = [
  { value: "ACNE", label: "Acne & Breakouts" },
  { value: "AGING", label: "Signs of Aging" },
  { value: "DRYNESS", label: "Dryness & Flaking" },
  { value: "SENSITIVITY", label: "Sensitivity & Redness" },
  { value: "PIGMENTATION", label: "Dark Spots & Pigmentation" },
  { value: "TEXTURE", label: "Uneven Texture" },
] as const;

const environmentalFactors = [
  { value: "UV_EXPOSURE", label: "High UV Exposure" },
  { value: "POLLUTION", label: "Air Pollution" },
  { value: "CLIMATE", label: "Harsh Climate" },
  { value: "STRESS", label: "High Stress Levels" },
  { value: "SLEEP", label: "Poor Sleep Quality" },
  { value: "DIET", label: "Unbalanced Diet" },
] as const;

const treatments = [
  { value: "DEEP_CHEMICAL_PEEL", label: "Deep Chemical Peel" },
  { value: "ABLATIVE_LASER", label: "Ablative Laser" },
  { value: "MICRONEEDLING", label: "Microneedling" },
  { value: "MEDIUM_PEEL", label: "Medium-Depth Peel" },
  { value: "LIGHT_PEEL", label: "Light Chemical Peel" },
  { value: "LED_THERAPY", label: "LED Light Therapy" },
] as const;

const formSchema = z.object({
  age: z.number().min(18).max(100),
  gender: z.enum(['male', 'female', 'other']),
  skinType: z.enum(['oily', 'dry', 'combination', 'normal', 'sensitive']),
  melanation: z.enum(['light', 'medium', 'dark']),
  concerns: z.array(z.string()),
  products: z.array(z.string()),
  environment: z.array(z.string()),
  lifestyle: z.array(z.string())
});

type FormData = z.infer<typeof formSchema>;

export interface BeautyRiskAssessmentProps {
  open: boolean;
  onClose: (updated: boolean) => void;
  onComplete: () => void;
  onStartAnalysis: () => void;
  onAnalysisComplete: (result: Array<{
    type: RiskFactorType;
    severity: RiskSeverity;
    description: string;
    recommendation?: string;
  }>) => void;
  onAnalysisEnd: () => void;
}

// Dynamically import components
const WebcamCapture = dynamic(() => import('./WebcamCapture'), {
  ssr: false,
  loading: () => <div>Loading camera...</div>
});

const MetricsDisplay = dynamic(() => import('./skin-analysis/MetricsDisplay'), {
  ssr: true
});

const ErrorDisplay = dynamic(() => import('./skin-analysis/ErrorDisplay'), {
  ssr: true
});

// Memoized types and interfaces
export interface SkinMetric {
  name: string;
  value: number;
  description: string;
}

interface SkinAnalysisProps {
  onAnalysisComplete: (metrics: SkinMetric[]) => void;
  onStartAnalysis: () => void;
  onAnalysisEnd: () => void;
}

// Memoized utility functions
const createMetric = (name: string, value: number, description: string): SkinMetric => ({
  name,
  value,
  description
});

// Update the Face type to match NormalizedFace
interface Face {
  keypoints: Array<{ x: number; y: number }>;
  box: {
    xMin: number;
    yMin: number;
    xMax: number;
    yMax: number;
  };
}

// Convert NormalizedFace to Face
const normalizedFaceToFace = (face: NormalizedFace): Face => {
  if (!face.topLeft || !face.bottomRight || !face.landmarks) {
    throw new Error('Invalid face detection result');
  }

  const [topLeft, bottomRight] = [face.topLeft, face.bottomRight].map(point => {
    if (!Array.isArray(point) || point.length < 2) {
      throw new Error('Invalid point data');
    }
    return {
      x: point[0] as number,
      y: point[1] as number
    };
  });

  const landmarks = Array.isArray(face.landmarks) 
    ? face.landmarks 
    : (face.landmarks as Tensor2D).arraySync() as number[][];

  return {
    keypoints: landmarks.map(point => ({
      x: Array.isArray(point) ? point[0] : (point as Tensor1D).arraySync()[0],
      y: Array.isArray(point) ? point[1] : (point as Tensor1D).arraySync()[1]
    })),
    box: {
      xMin: topLeft.x,
      yMin: topLeft.y,
      xMax: bottomRight.x,
      yMax: bottomRight.y
    }
  };
};

// Update the form field styles for better focus states
const formFieldStyles = {
  input: "focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary transition-all duration-300",
  select: "focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary transition-all duration-300",
  checkbox: "focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary data-[state=checked]:animate-in data-[state=unchecked]:animate-out transition-all duration-300",
  radio: "focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary data-[state=checked]:animate-in data-[state=unchecked]:animate-out transition-all duration-300",
};

export function BeautyRiskAssessment({
  open,
  onClose,
  onComplete,
  onStartAnalysis,
  onAnalysisComplete,
  onAnalysisEnd
}: BeautyRiskAssessmentProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [step, setStep] = useState(1);
  const [captures, setCaptures] = useState<string[]>([]);
  const [formData, setFormData] = useState<Partial<FormData>>({
    age: undefined,
    gender: undefined,
    skinType: undefined,
    melanation: undefined,
    concerns: [],
    products: [],
    environment: [],
    lifestyle: []
  });

  useEffect(() => {
    if (!open) {
      setStep(1);
      setCaptures([]);
      setFormData({
        age: undefined,
        gender: undefined,
        skinType: undefined,
        melanation: undefined,
        concerns: [],
        products: [],
        environment: [],
        lifestyle: []
      });
    }
  }, [open]);

  const handleSkinAnalysisComplete = useCallback((result: {
    type: RiskFactorType;
    severity: RiskSeverity;
    description: string;
    recommendation?: string;
  }) => {
    onAnalysisComplete([result]);
    setStep(step + 1);
  }, [onAnalysisComplete, step]);

  const handleCapturesChange = useCallback((newCaptures: string[]) => {
    setCaptures(newCaptures);
  }, []);

  const handleError = useCallback((error: string) => {
    logger.error('Beauty risk assessment error:', error);
    onClose(false);
  }, [onClose]);

  const handleClose = useCallback(() => {
    onClose(false);
  }, [onClose]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl">
        <div className="space-y-4">
          <Progress value={(step / 3) * 100} className="w-full" />
          
          {step === 1 && (
            <Card className="p-4">
              <SkinAnalysis
                onCapturesChange={handleCapturesChange}
                onAnalysisComplete={handleSkinAnalysisComplete}
                onError={handleError}
                onStartAnalysis={onStartAnalysis}
                onAnalysisEnd={onAnalysisEnd}
                captures={captures}
                isLoading={false}
                onStartCamera={() => {}}
              />
            </Card>
          )}

          {step === 2 && (
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">Additional Information</h3>
              {/* Form fields for age, gender, skin type, etc. */}
              <Button onClick={() => setStep(3)}>Next</Button>
            </Card>
          )}

          {step === 3 && (
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">Review & Submit</h3>
              {/* Display summary of collected data */}
              <Button onClick={onComplete}>Complete Assessment</Button>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default BeautyRiskAssessment; 