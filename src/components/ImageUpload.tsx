"use client";

import { UploadDropzone } from "@uploadthing/react";
import { OurFileRouter } from "@/app/api/uploadthing/core";
import { XIcon } from "lucide-react";

interface ImageUploadProps {
  onChange: (url?: string) => void;
  onRemove: () => void;
  value: string;
}

export default function ImageUpload({
  onChange,
  onRemove,
  value
}: ImageUploadProps) {
  return (
    <div>
      <div className="mb-4 flex items-center gap-4">
        {value && (
          <div className="relative h-[200px] w-[200px]">
            <img
              src={value}
              alt="Upload"
              className="h-full w-full rounded-md object-cover"
            />
            <button
              onClick={onRemove}
              className="absolute right-2 top-2 rounded-full bg-rose-500 p-1 text-white shadow-sm"
              type="button"
            >
              <XIcon className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
      {!value && (
        <UploadDropzone<OurFileRouter, "profileImage">
          endpoint="profileImage"
          onClientUploadComplete={(res) => {
            onChange(res?.[0]?.url);
          }}
          onUploadError={(error: Error) => {
            console.error(error);
          }}
        />
      )}
    </div>
  );
}
