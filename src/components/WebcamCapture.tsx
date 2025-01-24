'use client';

import React, { forwardRef } from 'react';
import Webcam from 'react-webcam';

interface WebcamCaptureProps {
  onUserMedia: () => void;
  onUserMediaError: (error: string | DOMException) => void;
}

const WebcamCapture = forwardRef<Webcam, WebcamCaptureProps>(
  ({ onUserMedia, onUserMediaError }, ref) => {
    return (
      <div className="relative rounded-lg overflow-hidden">
        <Webcam
          ref={ref}
          audio={false}
          screenshotFormat="image/jpeg"
          videoConstraints={{
            width: 720,
            height: 720,
            facingMode: "user"
          }}
          onUserMedia={onUserMedia}
          onUserMediaError={onUserMediaError}
          className="w-full"
        />
      </div>
    );
  }
);

WebcamCapture.displayName = 'WebcamCapture';

export default WebcamCapture; 