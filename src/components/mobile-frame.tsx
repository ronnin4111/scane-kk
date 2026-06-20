"use client";

import { cn } from "@/lib/utils";

interface MobileFrameProps {
  children: React.ReactNode;
  className?: string;
}

export function MobileFrame({ children, className }: MobileFrameProps) {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-emerald-50 via-emerald-50/30 to-teal-50/50 flex items-center justify-center sm:p-4">
      <div
        className={cn(
          "relative w-full sm:max-w-[420px] bg-background",
          "sm:rounded-[2.5rem] sm:shadow-2xl sm:border-[3px] sm:border-emerald-900/10",
          "sm:overflow-hidden sm:my-4 min-h-screen sm:min-h-[calc(100vh-2rem)] sm:h-[calc(100vh-2rem)]",
          "flex flex-col",
          className,
        )}
      >
        <div className="hidden sm:block absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-emerald-900/10 rounded-b-2xl z-50" />
        <div className="flex-1 flex flex-col overflow-hidden">{children}</div>
      </div>
    </div>
  );
}

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

export function AppHeader({
  title,
  subtitle,
  onBack,
  rightAction,
}: AppHeaderProps) {
  return (
    <header className="flex-shrink-0 bg-primary text-primary-foreground px-4 pt-6 pb-4 sm:pt-8">
      <div className="flex items-center gap-3">
        {onBack && (
          <button
            onClick={onBack}
            aria-label="Kembali"
            className="p-2 -ml-2 rounded-full hover:bg-white/15 transition-colors active:scale-95"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m12 19-7-7 7-7" />
              <path d="M19 12H5" />
            </svg>
          </button>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold leading-tight truncate">{title}</h1>
          {subtitle && (
            <p className="text-xs text-primary-foreground/80 truncate mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
        {rightAction}
      </div>
    </header>
  );
}
