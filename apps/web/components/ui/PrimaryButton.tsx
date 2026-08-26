import Link from "next/link";
import { ReactNode } from "react";

type Props = {
  children: ReactNode;
  href?: string;
  className?: string;
};

export default function PrimaryButton({
  children,
  href = "#",
  className = "",
}: Props) {
  return (
    <Link
      href={href}
      className={`
      group
      relative
      overflow-hidden
      rounded-xl
      bg-gradient-to-r
      from-blue-600
      via-blue-500
      to-cyan-500
      px-7
      py-4
      font-semibold
      text-white
      shadow-xl
      transition-all
      duration-300
      hover:-translate-y-1
      hover:scale-105
      hover:shadow-[0_0_40px_rgba(37,99,235,0.45)]
      ${className}
      `}
    >
      <span className="relative z-10">
        {children}
      </span>

      <span className="absolute inset-0 translate-y-full bg-white/10 transition-transform duration-300 group-hover:translate-y-0" />
    </Link>
  );
}