import { cn } from "@/lib/utils";

const SIZES = ["sm", "md", "lg"] as const;
type SizeType = (typeof SIZES)[number];

interface SizeConfig {
  container: string;
  cup: string;
  steam: string;
  text: string;
  tagline: string;
}

interface LogoProps extends React.HTMLAttributes<HTMLDivElement> {
  showText?: boolean;
  showTagline?: boolean;
  size?: SizeType;
}

const sizeConfigs: Record<SizeType, SizeConfig> = {
  sm: {
    container: "w-10 h-10",
    cup: "h-8 w-8",
    steam: "h-4",
    text: "text-lg",
    tagline: "text-xs"
  },
  md: {
    container: "w-12 h-12",
    cup: "h-10 w-10",
    steam: "h-5",
    text: "text-xl",
    tagline: "text-sm"
  },
  lg: {
    container: "w-16 h-16",
    cup: "h-14 w-14",
    steam: "h-6",
    text: "text-2xl",
    tagline: "text-base"
  }
};

export function Logo({ className, showText = true, showTagline = true, size = "md", ...props }: LogoProps) {
  const config = sizeConfigs[size];
  
  return (
    <div className={cn("flex items-center gap-4", className)} {...props}>
      <div className="flex items-center" aria-hidden="true">
        <div className={cn("relative", config.container)}>
          {/* Tea Cup with Steam */}
          <div className="absolute bottom-0 w-full">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className={config.cup}
            >
              {/* Steam */}
              <path
                d="M7 6C7 6 8 4 12 4C16 4 17 6 17 6"
                stroke="#FF69B4"
                strokeWidth="1.5"
                strokeLinecap="round"
                className="animate-pulse"
              />
              <path
                d="M9 4C9 4 10 2 12 2C14 2 15 4 15 4"
                stroke="#FF69B4"
                strokeWidth="1.5"
                strokeLinecap="round"
                className="animate-pulse"
              />
              {/* Cup Body */}
              <path
                d="M5 10C5 8.89543 5.89543 8 7 8H17C18.1046 8 19 8.89543 19 10V16C19 18.2091 17.2091 20 15 20H9C6.79086 20 5 18.2091 5 16V10Z"
                fill="#FF69B4"
              />
              {/* Handle */}
              <path
                d="M19 12H20C21.1046 12 22 12.8954 22 14V14C22 15.1046 21.1046 16 20 16H19"
                stroke="#FF69B4"
                strokeWidth="2"
                fill="#FF69B4"
              />
              {/* Saucer */}
              <path
                d="M4 20H20"
                stroke="#FF69B4"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
      </div>
      {showText && (
        <div className="flex flex-col">
          <span className={cn("font-bold tracking-tight text-foreground", config.text)}>
            PinkLife
          </span>
          {showTagline && (
            <span className={cn("text-muted-foreground", config.tagline)}>
              Beauty. Brains. Tea.
            </span>
          )}
        </div>
      )}
    </div>
  );
} 