import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface LoadingFallbackProps {
  progress?: number;
  message?: string;
  className?: string;
}

export function LoadingFallback({ 
  progress = 0, 
  message = "Loading...", 
  className 
}: LoadingFallbackProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-8 space-y-4", className)}>
      <Progress 
        value={progress} 
        className="w-full transition-all duration-300" 
      />
      <p className="text-sm text-muted-foreground animate-pulse">
        {message}
      </p>
    </div>
  );
}

export function ModelLoadingFallback({ className }: { className?: string }) {
  return (
    <LoadingFallback
      message="Loading analysis models..."
      className={className}
    />
  );
} 