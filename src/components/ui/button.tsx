import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary";
  size?: "default" | "sm";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = "default", size = "default", ...props },
    ref
  ) => {
    return (
      <button
      className={cn(
        "inline-flex items-center justify-center font-medium rounded transition-colors focus:outline-none focus:ring-1 focus:ring-pink-400 disabled:opacity-50 disabled:pointer-events-none",
        variant === "default"
          ? "bg-pink-950/80 text-pink-200 hover:bg-pink-800 hover:text-white"
          : "bg-white text-pink-800 border border-pink-200 hover:bg-pink-100 dark:bg-zinc-900/90 dark:text-pink-100",
        size === "sm" ? "h-8 px-2 text-xs" : "h-10 px-4 text-sm",
        className
      )}      
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";