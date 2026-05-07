import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepperProps {
  steps: string[];
  current: number; // 0-indexed active step
  className?: string;
}

export function Stepper({ steps, current, className }: StepperProps) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      {steps.map((label, i) => {
        const state = i < current ? "complete" : i === current ? "active" : "pending";
        return (
          <React.Fragment key={i}>
            <div className="flex items-center gap-2.5 px-1 py-1.5" data-state={state}>
              {/* Circle */}
              <div
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[13px] font-semibold transition-all",
                  state === "pending" && "border-[hsl(var(--border))] bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]",
                  state === "active" && "border-[hsl(var(--brand))] bg-[hsl(var(--brand))] text-[hsl(var(--brand-foreground))]",
                  state === "complete" && "border-[hsl(var(--brand)/0.3)] bg-[hsl(var(--brand)/0.15)] text-[hsl(var(--brand))]"
                )}
              >
                {state === "complete" ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : i + 1}
              </div>
              {/* Label */}
              <span
                className={cn(
                  "text-[13px] font-medium",
                  state === "pending" ? "text-[hsl(var(--muted-foreground))]" : "text-[hsl(var(--foreground))]"
                )}
              >
                {label}
              </span>
            </div>

            {/* Connector line */}
            {i < steps.length - 1 && (
              <div
                className={cn(
                  "h-0.5 flex-1 min-w-6 mx-1 transition-all",
                  i < current
                    ? "bg-[hsl(var(--brand)/0.4)]"
                    : "bg-[hsl(var(--border))]"
                )}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
