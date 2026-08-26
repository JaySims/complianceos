"use client";

type Props = {
  currentStep: number;
  totalSteps: number;
};

export default function ProgressBar({
  currentStep,
  totalSteps,
}: Props) {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="mb-10">

      <div className="flex justify-between mb-2">

        <span className="text-sm font-medium text-slate-700">
          Registration Progress
        </span>

        <span className="text-sm font-semibold text-blue-600">
          Step {currentStep} of {totalSteps}
        </span>

      </div>

      <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">

        <div
          className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 transition-all duration-500"
          style={{
            width: `${progress}%`,
          }}
        />

      </div>

    </div>
  );
}
