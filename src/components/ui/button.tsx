"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { forwardRef, type ButtonHTMLAttributes } from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-bold transition-all active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-4",
  {
    variants: {
      variant: {
        primary: "bg-primary text-white shadow-[0_8px_20px_var(--ring)]",
        ghost: "bg-surface-2 text-fg",
        outline: "border border-border text-fg hover:bg-surface-2",
      },
      size: {
        md: "h-12 px-5 text-[15px] rounded-[var(--radius-md)]",
        sm: "h-10 px-4 text-sm rounded-[var(--radius-md)]",
        icon: "h-11 w-11 rounded-full",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, style, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      style={{ boxShadow: undefined, ...style }}
      {...props}
    />
  )
);
Button.displayName = "Button";
export { buttonVariants };
