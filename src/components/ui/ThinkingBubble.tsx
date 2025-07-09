// components/ui/ThinkingBubble.tsx
import React from "react";
import { cn } from "@/lib/utils";

export const ThinkingBubble: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn(
    "px-2 py-1 rounded-2xl bg-black border border-pink-900 text-pink-300 mb-1 max-w-[75%] animate-pulse text-xs",
    className
  )}>
    Pixl Bot is thinking…
  </div>
);
