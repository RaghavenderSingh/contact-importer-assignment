"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StepperStep {
  state: "complete" | "current" | "pending";
  stepCount: number;
  heading: string;
  subtext: string;
}

interface StepperProps {
  steps: StepperStep[];
  className?: string;
}

export default function Stepper({ steps, className }: StepperProps) {
  const getStepStyles = (state: StepperStep["state"]) => {
    switch (state) {
      case "complete":
        return {
          indicator: "bg-[#0E9634] text-white",
          heading: "text-[#666666] font-medium",
          subtext: "text-[#68818C] font-normal",
        };
      case "current":
        return {
          indicator: "bg-[#0E4259] text-white",
          heading: "text-[#0E4259] font-semibold",
          subtext: "text-[#68818C] font-normal",
        };
      case "pending":
        return {
          indicator: "bg-[#EBF0F8] text-[#666666]",
          heading: "text-[#666666] font-medium",
          subtext: "text-[#68818C] font-normal",
        };
      default:
        return {
          indicator: "bg-[#EBF0F8] text-[#666666]",
          heading: "text-[#666666] font-medium",
          subtext: "text-[#68818C] font-normal",
        };
    }
  };

  const renderStepContent = (step: StepperStep) => {
    if (step.state === "complete") {
      return <Check className="w-5 h-5" />;
    }
    return <span className="text-sm font-semibold">{step.stepCount}</span>;
  };

  return (
    <div className={cn("flex flex-col sm:flex-row gap-6 sm:gap-10", className)}>
      {steps.map((step, index) => {
        const styles = getStepStyles(step.state);

        return (
          <div key={index} className="flex items-center gap-3 w-[314px] h-12">
            <div
              className={cn(
                "h-[42px] w-[42px] rounded-md flex items-center justify-center",
                styles.indicator
              )}
            >
              {renderStepContent(step)}
            </div>

            <div className="flex-1 min-w-0">
              <h3
                className={cn(
                  "text-[18px] leading-[100%] font-geist-variable",
                  styles.heading
                )}
              >
                {step.heading}
              </h3>
              <p
                className={cn(
                  "text-[15px] leading-[120%] font-geist-variable",
                  styles.subtext
                )}
              >
                {step.subtext}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
