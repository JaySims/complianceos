type Props = {
  title?: string;
  children: React.ReactNode;
  className?: string;
};

export default function Card({
  title,
  children,
  className = "",
}: Props) {
  return (
    <div
      className={`rounded-2xl border border-slate-100 bg-white p-8 shadow-xl ${className}`}
    >
      {title && (
        <h2 className="mb-6 text-2xl font-bold text-slate-900">
          {title}
        </h2>
      )}

      {children}
    </div>
  );
}
