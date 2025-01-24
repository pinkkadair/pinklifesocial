'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useUploadThing } from '@/lib/uploadthing';
import { Video, Upload } from 'lucide-react';

interface WorkshopRecordingUploadProps {
  workshopId: string;
  onSuccess?: () => void;
}

export default function WorkshopRecordingUpload({
  workshopId,
  onSuccess,
}: WorkshopRecordingUploadProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);

  const { startUpload } = useUploadThing("workshopRecording", {
    onClientUploadComplete: () => {
      setIsUploading(false);
      toast({
        title: 'Success',
        description: 'Workshop recording uploaded successfully',
      });
      router.refresh();
      onSuccess?.();
    },
    onUploadError: (error) => {
      setIsUploading(false);
      toast({
        title: 'Error',
        description: error.message || 'Failed to upload recording',
        variant: 'destructive',
      });
    },
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    
    setIsUploading(true);
    try {
      const files = Array.from(e.target.files);
      await startUpload(files);
    } catch (error) {
      setIsUploading(false);
      toast({
        title: 'Error',
        description: 'Failed to upload recording',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Video className="w-4 h-4" />
        <span className="text-sm">Upload workshop recording</span>
      </div>

      <div className="grid w-full max-w-sm items-center gap-1.5">
        <label htmlFor="recording" className="sr-only">
          Workshop Recording
        </label>
        <Button
          variant="outline"
          className="w-full"
          disabled={isUploading}
          onClick={() => document.getElementById('recording')?.click()}
        >
          {isUploading ? (
            <>
              <LoadingSpinner className="mr-2 h-4 w-4" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload Recording
            </>
          )}
        </Button>
        <input
          id="recording"
          type="file"
          accept="video/*"
          className="hidden"
          onChange={handleUpload}
          disabled={isUploading}
        />
      </div>

      {isUploading && (
        <p className="text-sm text-muted-foreground animate-pulse">
          Uploading recording... This may take a while depending on the file size.
        </p>
      )}
    </div>
  );
} 