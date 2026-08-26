"use client";

type KPI = {
  title: string;
  value: string | number;
  color: string;
};

type KPIGridProps = {
  items: KPI[];
};

export default function KPIGrid({
  items,
}: KPIGridProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">

      {items.map((item) => (

        <div
          key={item.title}
          className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-lg transition"
        >

          <div
            className="w-4 h-4 rounded-full mb-5"
            style={{
              backgroundColor: item.color,
            }}
          />

          <h3 className="text-sm text-slate-500">
            {item.title}
          </h3>

          <p className="mt-2 text-4xl font-bold text-slate-900">
            {item.value}
          </p>

        </div>

      ))}

    </div>
  );
}
