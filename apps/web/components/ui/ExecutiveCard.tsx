import { ReactNode } from "react";

type Props = {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
};

export default function ExecutiveCard({
  children,
  title,
  subtitle,
  className = "",
}: Props) {
  return (
    <div
      className={`
      rounded-3xl
      border
      border-slate-200
      bg-white
      shadow-lg
      hover:shadow-2xl
      transition-all
      duration-300
      p-8
      ${className}
    `}
    >
      {(title || subtitle) && (
        <div className="mb-8">
          {title && (
            <h2 className="text-2xl font-bold text-slate-900">
              {title}
            </h2>
          )}

          {subtitle && (
            <p className="text-slate-500 mt-2">
              {subtitle}
            </p>
          )}
        </div>
      )}

      {children}
    </div>
  );
}
