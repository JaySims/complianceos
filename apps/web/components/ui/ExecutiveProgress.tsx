"use client";

type ExecutiveProgressProps = {
  current: number;
  total: number;
  title?: string;
};

export default function ExecutiveProgress({
  current,
  total,
  title,
}: ExecutiveProgressProps) {
  const percentage = Math.round((current / total) * 100);

  return (
    <div className="space-y-4">

      {(title || total > 0) && (
        <div className="flex items-center justify-between">

          <div>
            {title && (
              <h3 className="text-lg font-semibold text-slate-900">
                {title}
              </h3>
            )}

            <p className="text-sm text-slate-500">
              Step {current} of {total}
            </p>
          </div>

          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">
              {percentage}%
            </div>
          </div>

        </div>
      )}

      {/* Progress Bar */}

      <div className="w-full h-3 rounded-full bg-slate-200 overflow-hidden">

        <div
          className="h-full rounded-full bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500 transition-all duration-700 ease-out"
          style={{
            width: `${percentage}%`,
          }}
        />

      </div>

      {/* Step Indicators */}

      <div className="flex justify-between mt-2">

        {Array.from({ length: total }).map((_, index) => {
          const step = index + 1;

          const active = step <= current;

          return (
            <div
              key={step}
              className={`w-4 h-4 rounded-full transition-all duration-500 ${
                active
                  ? "bg-blue-600 scale-110"
                  : "bg-slate-300"
              }`}
            />
          );
        })}

      </div>

    </div>
  );
}
