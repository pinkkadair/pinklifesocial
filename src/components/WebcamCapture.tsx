'use client';

import React, { Suspense } from 'react';
import type { WebcamProps } from 'react-webcam';

const LoadingPlaceholder = () => (
  <div className="w-full h-[480px] bg-muted rounded-lg flex items-center justify-center">
    Loading camera...
  </div>
);

// Use React.lazy for client-side only import
const ReactWebcam = React.lazy(() => import('react-webcam'));

interface WebcamCaptureProps {
  webcamRef: React.RefObject<any>;
  onUserMedia?: (stream: MediaStream) => void;
  onUserMediaError?: (error: string | DOMException) => void;
}

export default function WebcamCapture({ webcamRef, onUserMedia, onUserMediaError }: WebcamCaptureProps) {
  const handleUserMedia = React.useCallback((stream: MediaStream) => {
    onUserMedia?.(stream);
  }, [onUserMedia]);

  const handleUserMediaError = React.useCallback((error: string | DOMException) => {
    onUserMediaError?.(error);
  }, [onUserMediaError]);

  return (
    <Suspense fallback={<LoadingPlaceholder />}>
      <ReactWebcam
        ref={webcamRef}
        audio={false}
        screenshotFormat="image/jpeg"
        videoConstraints={{
          width: 640,
          height: 480,
          facingMode: "user"
        }}
        onUserMedia={handleUserMedia}
        onUserMediaError={handleUserMediaError}
        className="rounded-lg w-full"
        mirrored
        imageSmoothing={true}
        screenshotQuality={1}
        forceScreenshotSourceSize={false}
        disablePictureInPicture={true}
      />
    </Suspense>
  );
} 