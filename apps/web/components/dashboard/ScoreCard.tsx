"use client";

type Props = {
  title: string;
  score: number;
  description: string;
};

export default function ScoreCard({
  title,
  score,
  description,
}: Props) {
  const color =
    score >= 80
      ? "text-emerald-600"
      : score >= 60
      ? "text-yellow-500"
      : "text-red-500";

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 border border-slate-100">

      <p className="text-gray-500 text-sm">
        {title}
      </p>

      <div className={`text-5xl font-bold mt-4 ${color}`}>
        {score}%
      </div>

      <div className="w-full h-3 bg-gray-200 rounded-full mt-6 overflow-hidden">

        <div
          className="h-full bg-emerald-500 rounded-full"
          style={{
            width: `${score}%`,
          }}
        />

      </div>

      <p className="text-sm text-gray-500 mt-5">
        {description}
      </p>

    </div>
  );
}
