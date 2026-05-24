import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium shadow-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:pointer-events-none disabled:opacity-50 md:cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-linear-to-r from-indigo-700 to-fuchsia-700 text-white hover:from-indigo-600 hover:to-fuchsia-600 dark:from-indigo-500 dark:to-fuchsia-500 dark:hover:from-indigo-400 dark:hover:to-fuchsia-400",
        secondary:
          "border border-amber-300 bg-amber-100 text-amber-950 hover:bg-amber-200 dark:border-amber-500/70 dark:bg-amber-300 dark:text-amber-950 dark:hover:bg-amber-200",
        outline:
          "border border-indigo-300 bg-white/90 text-indigo-900 hover:bg-indigo-50 dark:border-indigo-400/70 dark:bg-slate-900 dark:text-indigo-100 dark:hover:bg-slate-800",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3 text-xs",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonProps): React.JSX.Element {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}
