import React, { useRef, useEffect, useCallback } from 'react';
import { logger } from '@/lib/logger';

interface WebcamProps {
  onUserMedia?: () => void;
  onUserMediaError?: (error: string | DOMException) => void;
  videoConstraints?: MediaTrackConstraints;
  className?: string;
}

interface WebcamRef extends HTMLVideoElement {
  getScreenshot: () => string | null;
}

export const Webcam = React.forwardRef<WebcamRef, WebcamProps>(
  ({ onUserMedia, onUserMediaError, videoConstraints, className }, ref) => {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const getVideo = useCallback(async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints || true,
          audio: false,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          streamRef.current = stream;
          onUserMedia?.();
        }
      } catch (error) {
        logger.error('Error accessing webcam:', error);
        onUserMediaError?.(error instanceof Error ? error.message : String(error));
      }
    }, [onUserMedia, onUserMediaError, videoConstraints]);

    useEffect(() => {
      getVideo();

      return () => {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
      };
    }, [getVideo]);

    const getScreenshot = () => {
      if (!videoRef.current) return null;

      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      ctx.drawImage(video, 0, 0);
      return canvas.toDataURL('image/jpeg');
    };

    if (typeof ref === 'function') {
      if (videoRef.current) {
        const enhancedRef = Object.assign(videoRef.current, {
          getScreenshot,
        });
        ref(enhancedRef as WebcamRef);
      }
    } else if (ref && videoRef.current) {
      const enhancedRef = Object.assign(videoRef.current, {
        getScreenshot,
      });
      ref.current = enhancedRef as WebcamRef;
    }

    return (
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={className}
        style={{ transform: 'scaleX(-1)' }}
      />
    );
  }
);

Webcam.displayName = 'Webcam'; 