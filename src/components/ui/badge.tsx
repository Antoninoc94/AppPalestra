import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "bg-orange-500/20 text-orange-400 border border-orange-500/30",
        secondary: "bg-zinc-800 text-zinc-300 border border-zinc-700",
        destructive: "bg-red-500/20 text-red-400 border border-red-500/30",
        success: "bg-green-500/20 text-green-400 border border-green-500/30",
        outline: "border border-zinc-700 text-zinc-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
