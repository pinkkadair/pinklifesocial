'use client';

import React, { useRef, useCallback, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CameraIcon, XIcon } from 'lucide-react';
import dynamic from 'next/dynamic';
import { mlManager } from '@/lib/ml-models';
import { logger } from '@/lib/logger';

// Only import WebcamCapture dynamically since it directly uses browser APIs
const WebcamCapture = dynamic(() => import('./WebcamCapture'), {
  ssr: false,
});

interface SkinMetric {
  name: string;
  value: number;
  description: string;
}

interface SkinAnalysisProps {
  onAnalysisComplete: (metrics: SkinMetric[]) => void;
  onStartAnalysis: () => void;
  onAnalysisEnd: () => void;
}

export default function SkinAnalysis({
  onAnalysisComplete,
  onStartAnalysis,
  onAnalysisEnd,
}: SkinAnalysisProps) {
  const webcamRef = useRef<any>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [captureCount, setCaptureCount] = useState(0);
  const [captures, setCaptures] = useState<ImageData[]>([]);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset function
  const resetState = useCallback(() => {
    setShowCamera(false);
    setCaptures([]);
    setCaptureCount(0);
    setIsAnalyzing(false);
    setProgress(0);
    setIsCameraReady(false);
    setError(null);
  }, []);

  // Load ML models
  useEffect(() => {
    let mounted = true;
    async function loadModels() {
      try {
        setIsModelLoading(true);
        setError(null);
        await mlManager.loadModels();
        if (mounted) {
          setIsModelLoading(false);
        }
      } catch (error) {
        logger.error('Failed to load ML models:', error as Error);
        if (mounted) {
          setError('Failed to load ML models. Please try again.');
          setIsModelLoading(false);
        }
      }
    }
    loadModels();
    return () => {
      mounted = false;
    };
  }, []);

  const handleUserMedia = useCallback(() => {
    logger.info('Camera initialized successfully');
    setIsCameraReady(true);
    setError(null);
  }, []);

  const handleUserMediaError = useCallback((error: string | DOMException) => {
    logger.error('Camera initialization error:', error instanceof Error ? error : new Error(error.toString()));
    setError(
      error instanceof DOMException
        ? `Camera error: ${error.name} - ${error.message}`
        : 'Failed to access camera. Please ensure camera permissions are granted.'
    );
    setIsCameraReady(false);
  }, []);

  const processCaptures = async (imagesToProcess: ImageData[]): Promise<SkinMetric[] | null> => {
    try {
      const results = await Promise.all(
        imagesToProcess.map(async (imageData) => {
          const face = await mlManager.detectFace(imageData);
          if (!face) {
            throw new Error('No face detected in image');
          }

          const [textureScore, toneScore] = await Promise.all([
            mlManager.analyzeSkinTexture(imageData, face),
            mlManager.analyzeSkinTone(imageData, face),
          ]);

          return {
            texture: textureScore,
            tone: toneScore,
          };
        })
      );

      // Average the results
      const avgTexture = results.reduce((sum, r) => sum + r.texture, 0) / results.length;
      const avgTone = results.reduce((sum, r) => sum + r.tone, 0) / results.length;

      return [
        {
          name: 'Skin Texture',
          value: avgTexture,
          description: 'Analysis of skin surface texture and evenness',
        },
        {
          name: 'Skin Tone',
          value: avgTone,
          description: 'Analysis of skin tone and color distribution',
        },
      ];
    } catch (error) {
      logger.error('Failed to process captures:', error as Error);
      throw error;
    }
  };

  const handleCapture = useCallback(async () => {
    if (!webcamRef.current) {
      logger.error('Webcam ref is null');
      setError('Camera not initialized properly. Please try again.');
      return;
    }

    if (!webcamRef.current.video) {
      logger.error('Video element is null');
      setError('Camera video stream not available. Please try again.');
      return;
    }

    if (!isCameraReady) {
      logger.error('Camera not ready');
      setError('Please wait for camera to initialize.');
      return;
    }

    if (isAnalyzing || captureCount >= 3) {
      logger.info('Already analyzing or capture limit reached');
      return;
    }

    try {
      setIsAnalyzing(true);
      setError(null);
      
      if (captureCount === 0) {
        onStartAnalysis();
      }

      const currentProgress = ((captureCount + 1) / 3) * 100;
      setProgress(currentProgress);

      // Wait for video to be ready with timeout
      const video = webcamRef.current.video;
      if (!video || video.readyState !== 4) {
        await Promise.race([
          new Promise<void>((resolve, reject) => {
            const checkReady = () => {
              if (video?.readyState === 4) {
                resolve();
              } else if (!video) {
                reject(new Error('Video element became unavailable'));
              } else {
                setTimeout(checkReady, 100);
              }
            };
            checkReady();
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Video stream timeout')), 10000)
          )
        ]);
      }

      // Capture image
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) {
        throw new Error('Failed to capture image');
      }

      // Process image
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageSrc;
      });

      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Failed to get canvas context');
      }

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      const newCaptures = [...captures, imageData];
      const newCaptureCount = captureCount + 1;
      
      setCaptures(newCaptures);
      setCaptureCount(newCaptureCount);

      if (newCaptureCount === 3) {
        setProgress(80);
        const metrics = await processCaptures(newCaptures);

        if (metrics) {
          setProgress(90);
          onAnalysisComplete(metrics);
          setProgress(100);
          
          setTimeout(() => {
            resetState();
            onAnalysisEnd();
          }, 1500);
        } else {
          throw new Error('Failed to process captures');
        }
      } else {
        setIsAnalyzing(false);
        setProgress(0);
      }
    } catch (error) {
      logger.error('Capture failed:', error as Error);
      setError('Failed to capture image. Please try again.');
      setIsAnalyzing(false);
      setProgress(0);
      if (captureCount === 0) {
        onAnalysisEnd();
      }
    }
  }, [webcamRef, isCameraReady, isAnalyzing, captureCount, captures, onAnalysisComplete, onAnalysisEnd, onStartAnalysis, resetState]);

  if (isModelLoading) {
    return (
      <Card className="p-6 text-center">
        <div className="space-y-4">
          <p>Loading skin analysis models...</p>
          <Progress value={50} className="w-full" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          <p className="text-red-500">{error}</p>
          <Button onClick={resetState}>Try Again</Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        {!showCamera ? (
          <Button
            onClick={() => setShowCamera(true)}
            disabled={isModelLoading}
            className="w-full"
          >
            <CameraIcon className="w-4 h-4 mr-2" />
            Start Skin Analysis
          </Button>
        ) : (
          <div className="space-y-4">
            <div className="relative">
              <WebcamCapture
                webcamRef={webcamRef}
                onUserMedia={handleUserMedia}
                onUserMediaError={handleUserMediaError}
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2"
                onClick={() => {
                  setShowCamera(false);
                  onAnalysisEnd();
                }}
              >
                <XIcon className="w-4 h-4" />
              </Button>
            </div>
            
            {isCameraReady && (
              <div className="space-y-4">
                <Button
                  onClick={handleCapture}
                  disabled={isAnalyzing}
                  className="w-full"
                >
                  {isAnalyzing ? 'Processing...' : `Capture Image ${captureCount + 1}/3`}
                </Button>
                {(isAnalyzing || progress > 0) && (
                  <Progress value={progress} className="w-full" />
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
} 