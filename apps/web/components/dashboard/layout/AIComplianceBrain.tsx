"use client";

type AIComplianceBrainProps = {
  score: number;
  recommendations: string[];
};

export default function AIComplianceBrain({
  score,
  recommendations,
}: AIComplianceBrainProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">

      <div className="flex items-center justify-between">

        <div>

          <h2 className="text-2xl font-bold text-slate-900">
            AI Compliance Brain
          </h2>

          <p className="text-slate-500 mt-1">
            Real-time analysis of your organisation's compliance health.
          </p>

        </div>

        <div className="text-right">

          <p className="text-sm text-slate-500">
            AI Confidence
          </p>

          <p className="text-4xl font-bold text-emerald-600">
            {score}%
          </p>

        </div>

      </div>

      <div className="mt-8">

        <h3 className="font-semibold text-slate-800 mb-4">
          Priority Recommendations
        </h3>

        <div className="space-y-3">

          {recommendations.map((item, index) => (

            <div
              key={index}
              className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200"
            >

              <div className="mt-1 text-emerald-600">
                ✓
              </div>

              <p className="text-slate-700">
                {item}
              </p>

            </div>

          ))}

        </div>

      </div>

    </div>
  );
}
