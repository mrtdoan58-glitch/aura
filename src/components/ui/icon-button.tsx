"use client";

import { cn } from "@/lib/utils";
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  badge?: boolean;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ children, badge, className, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "relative grid h-11 w-11 place-items-center rounded-full text-fg transition-all hover:bg-surface-2 active:scale-90",
        className
      )}
      {...props}
    >
      {badge && (
        <span className="absolute right-2.5 top-2.5 h-2.5 w-2.5 rounded-full bg-danger border-2 border-bg" />
      )}
      {children}
    </button>
  )
);
IconButton.displayName = "IconButton";
