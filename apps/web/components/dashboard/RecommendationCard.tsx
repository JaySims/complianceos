"use client";

type Props = {
  title: string;
  description: string;
  priority: "High" | "Medium" | "Low";
};

export default function RecommendationCard({
  title,
  description,
  priority,
}: Props) {
  const badgeColor =
    priority === "High"
      ? "bg-red-100 text-red-700"
      : priority === "Medium"
      ? "bg-yellow-100 text-yellow-700"
      : "bg-green-100 text-green-700";

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">

      <div className="flex items-center justify-between mb-4">

        <h3 className="text-xl font-semibold text-slate-900">
          {title}
        </h3>

        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${badgeColor}`}
        >
          {priority}
        </span>

      </div>

      <p className="text-gray-600 leading-relaxed">
        {description}
      </p>

      <button
        className="mt-6 rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 transition"
      >
        View Recommendation
      </button>

    </div>
  );
}
