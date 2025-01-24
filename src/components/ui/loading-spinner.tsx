import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function LoadingSpinner({ className, size = "md" }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4 border-2",
    md: "h-8 w-8 border-3",
    lg: "h-12 w-12 border-4",
  };

  return (
    <div className="flex justify-center items-center w-full h-full min-h-[100px]">
      <div
        className={cn(
          "animate-spin rounded-full border-pink-500 border-t-transparent",
          sizeClasses[size],
          className
        )}
      />
    </div>
  );
} 