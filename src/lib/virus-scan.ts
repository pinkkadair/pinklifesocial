import { Readable } from "stream";
import { logger } from "./logger";
import { ApiError } from "./api-error";

interface ScanResult {
  isClean: boolean;
  threat?: string;
}

export async function scanBuffer(buffer: Buffer): Promise<ScanResult> {
  try {
    if (!process.env.CLAMAV_HOST) {
      logger.warn("ClamAV host not configured, skipping virus scan");
      return { isClean: true };
    }

    const response = await fetch(`${process.env.CLAMAV_HOST}/scan`, {
      method: "POST",
      body: buffer,
      headers: {
        "Content-Type": "application/octet-stream",
      },
    });

    if (!response.ok) {
      throw new Error(`ClamAV scan failed: ${response.statusText}`);
    }

    const result = await response.json();
    return {
      isClean: !result.infected,
      threat: result.viruses?.[0],
    };
  } catch (error) {
    logger.error("Virus scan failed:", error);
    throw new ApiError("File scanning failed", 500);
  }
}

export async function scanStream(stream: Readable): Promise<ScanResult> {
  const chunks: Buffer[] = [];
  
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }
  
  const buffer = Buffer.concat(chunks);
  return scanBuffer(buffer);
}

export async function scanFile(file: File): Promise<ScanResult> {
  const buffer = await file.arrayBuffer();
  return scanBuffer(Buffer.from(buffer));
}

// Middleware for scanning uploaded files
export async function withVirusScan(handler: Function) {
  return async (req: Request) => {
    try {
      const formData = await req.formData();
      const files = Array.from(formData.values()).filter(
        (value): value is File => value instanceof File
      );

      // Scan all files in parallel
      const scanResults = await Promise.all(
        files.map(async (file) => {
          const result = await scanFile(file);
          return {
            fileName: file.name,
            ...result,
          };
        })
      );

      // Check if any files are infected
      const infectedFiles = scanResults.filter((result) => !result.isClean);
      if (infectedFiles.length > 0) {
        throw new ApiError(
          `Malware detected in files: ${infectedFiles
            .map((f) => f.fileName)
            .join(", ")}`,
          400
        );
      }

      // Continue with the original request handler
      return handler(req);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error("File scanning middleware error:", error);
      throw new ApiError("File processing failed", 500);
    }
  };
} 