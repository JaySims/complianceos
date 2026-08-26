"use client";

type Props = {
  title: string;
  organisation: string;
  value: string;
  deadline: string;
};

export default function OpportunityCard({
  title,
  organisation,
  value,
  deadline,
}: Props) {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">

      <div className="flex items-center justify-between">

        <div>

          <h3 className="text-xl font-bold text-slate-900">
            {title}
          </h3>

          <p className="text-gray-500 mt-1">
            {organisation}
          </p>

        </div>

        <div className="text-right">

          <p className="text-emerald-600 text-2xl font-bold">
            {value}
          </p>

          <p className="text-sm text-gray-500">
            Potential Value
          </p>

        </div>

      </div>

      <div className="mt-6 flex justify-between items-center">

        <span className="text-sm text-gray-500">
          Deadline
        </span>

        <span className="font-semibold">
          {deadline}
        </span>

      </div>

      <button
        className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-3 transition"
      >
        View Opportunity
      </button>

    </div>
  );
}
