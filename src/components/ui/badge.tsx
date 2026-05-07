import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium h-[22px] transition-colors",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[hsl(var(--brand))] text-[hsl(var(--brand-foreground))]",
        secondary:
          "border-transparent bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))]",
        outline:
          "border-[hsl(var(--border))] text-[hsl(var(--foreground))]",
        destructive:
          "border-[hsl(var(--destructive)/0.3)] bg-[hsl(var(--destructive)/0.12)] text-[hsl(var(--destructive))]",
        success:
          "border-[hsl(var(--success)/0.3)] bg-[hsl(var(--success)/0.12)] text-[hsl(var(--success))]",
        warning:
          "border-[hsl(var(--warning)/0.3)] bg-[hsl(var(--warning)/0.14)] text-[hsl(var(--warning))]",
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
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
