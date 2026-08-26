"use client";

type DigitalTrustEngineProps = {
  trustScore: number;
  complianceScore: number;
};

export default function DigitalTrustEngine({
  trustScore,
  complianceScore,
}: DigitalTrustEngineProps) {
  const riskScore = 100 - trustScore;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">

      <div className="flex items-center justify-between mb-8">

        <div>

          <h2 className="text-2xl font-bold text-slate-900">
            Digital Trust Engine™
          </h2>

          <p className="text-slate-500 mt-1">
            Executive Trust Intelligence
          </p>

        </div>

        <div className="text-right">

          <p className="text-sm text-slate-500">
            Trust Rating
          </p>

          <p className="text-5xl font-bold text-emerald-600">
            {trustScore}%
          </p>

        </div>

      </div>

      <div className="space-y-6">

        <div>

          <div className="flex justify-between mb-2">

            <span className="font-medium">
              Digital Trust
            </span>

            <span>{trustScore}%</span>

          </div>

          <div className="w-full h-3 rounded-full bg-slate-200 overflow-hidden">

            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-700"
              style={{
                width: `${trustScore}%`,
              }}
            />

          </div>

        </div>

        <div>

          <div className="flex justify-between mb-2">

            <span className="font-medium">
              Compliance
            </span>

            <span>{complianceScore}%</span>

          </div>

          <div className="w-full h-3 rounded-full bg-slate-200 overflow-hidden">

            <div
              className="h-full rounded-full bg-blue-600 transition-all duration-700"
              style={{
                width: `${complianceScore}%`,
              }}
            />

          </div>

        </div>

        <div>

          <div className="flex justify-between mb-2">

            <span className="font-medium">
              Risk Exposure
            </span>

            <span>{riskScore}%</span>

          </div>

          <div className="w-full h-3 rounded-full bg-slate-200 overflow-hidden">

            <div
              className="h-full rounded-full bg-red-500 transition-all duration-700"
              style={{
                width: `${riskScore}%`,
              }}
            />

          </div>

        </div>

      </div>

      <div className="mt-10 rounded-xl bg-slate-50 border border-slate-200 p-5">

        <h3 className="font-semibold text-slate-900 mb-2">
          AI Executive Summary
        </h3>

        <p className="text-slate-600 leading-relaxed">
          Your organisation demonstrates a strong digital trust profile.
          Completing the remaining compliance actions and uploading outstanding
          governance documents could significantly improve your Trust Score and
          strengthen eligibility for procurement, funding, and strategic
          partnerships.
        </p>

      </div>

    </div>
  );
}
