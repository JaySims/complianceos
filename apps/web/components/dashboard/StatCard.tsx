type Props = {
  title: string;
  value: number | string;
  color: string;
};

export default function StatCard({
  title,
  value,
  color,
}: Props) {
  return (
    <div className="rounded-2xl bg-white shadow-xl p-8">

      <p className="text-gray-500">
        {title}
      </p>

      <h2
        className="text-5xl font-bold mt-4"
        style={{ color }}
      >
        {value}
      </h2>

    </div>
  );
}
