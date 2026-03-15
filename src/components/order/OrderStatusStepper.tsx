"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { key: "PENDING", label: "Order Placed" },
  { key: "PREPARING", label: "Preparing" },
  { key: "OUT_FOR_DELIVERY", label: "Out for Delivery" },
  { key: "DELIVERED", label: "Delivered" },
] as const;

interface OrderStatusStepperProps {
  currentStatus: string;
  className?: string;
}

export function OrderStatusStepper({ currentStatus, className }: OrderStatusStepperProps) {
  const currentIndex = STEPS.findIndex((s) => s.key === currentStatus);
  const effectiveIndex = currentIndex >= 0 ? currentIndex : 0;

  return (
    <div className={cn("space-y-4", className)}>
      {STEPS.map((step, i) => {
        const isDone = i < effectiveIndex || currentStatus === "DELIVERED";
        const isCurrent = i === effectiveIndex && currentStatus !== "CANCELLED";
        return (
          <div key={step.key} className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                isDone && "border-primary bg-primary text-primary-foreground",
                isCurrent && !isDone && "border-primary bg-primary/10",
                !isDone && !isCurrent && "border-muted bg-muted/50"
              )}
            >
              {isDone ? <Check className="h-5 w-5" /> : i + 1}
            </div>
            <div>
              <p className={cn("font-medium", isCurrent && "text-primary")}>
                {step.label}
              </p>
            </div>
          </div>
        );
      })}
      {currentStatus === "CANCELLED" && (
        <p className="text-destructive font-medium">Order cancelled</p>
      )}
    </div>
  );
}
