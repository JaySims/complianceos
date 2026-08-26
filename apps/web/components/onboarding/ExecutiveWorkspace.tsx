"use client";

import { ReactNode } from "react";

import ExecutiveProgress from "@/components/ui/ExecutiveProgress";
import ExecutiveSection from "@/components/ui/ExecutiveSection";
import ExecutiveButton from "@/components/ui/ExecutiveButton";

type ExecutiveWorkspaceProps = {
  currentStep: number;
  totalSteps: number;
  title: string;
  children: ReactNode;
  onPrevious: () => void;
  onNext: () => void;
  nextLabel?: string;
  previousDisabled?: boolean;
  nextDisabled?: boolean;
};

export default function ExecutiveWorkspace({
  currentStep,
  totalSteps,
  title,
  children,
  onPrevious,
  onNext,
  nextLabel = "Continue Mission",
  previousDisabled = false,
  nextDisabled = false,
}: ExecutiveWorkspaceProps) {
  return (

    <div className="space-y-8">

      {/* Mission Progress */}

      <ExecutiveProgress
        current={currentStep}
        total={totalSteps}
        title={title}
      />

      {/* Mission Workspace */}

      <ExecutiveSection>

        {children}

      </ExecutiveSection>

      {/* Navigation */}

      <div className="flex justify-between">

        <ExecutiveButton
          variant="secondary"
          onClick={onPrevious}
          disabled={previousDisabled}
        >
          Previous Mission
        </ExecutiveButton>

        <ExecutiveButton
          onClick={onNext}
          disabled={nextDisabled}
        >
          {nextLabel}
        </ExecutiveButton>

      </div>

    </div>

  );
}
