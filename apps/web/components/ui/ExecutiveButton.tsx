"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "primary" | "secondary" | "success" | "danger";
  fullWidth?: boolean;
};

export default function ExecutiveButton({
  children,
  variant = "primary",
  fullWidth = false,
  className = "",
  ...props
}: Props) {
  const variants = {
    primary:
      "bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:from-blue-700 hover:to-cyan-600 shadow-lg hover:shadow-xl",

    secondary:
      "bg-white text-slate-800 border border-slate-300 hover:bg-slate-100 shadow",

    success:
      "bg-gradient-to-r from-emerald-600 to-green-500 text-white hover:from-emerald-700 hover:to-green-600 shadow-lg hover:shadow-xl",

    danger:
      "bg-gradient-to-r from-red-600 to-rose-500 text-white hover:from-red-700 hover:to-rose-600 shadow-lg hover:shadow-xl",
  };

  return (
    <button
      {...props}
      className={`
        inline-flex
        items-center
        justify-center
        gap-2
        rounded-2xl
        px-6
        py-4
        text-base
        font-semibold
        transition-all
        duration-300
        active:scale-[0.98]
        disabled:opacity-50
        disabled:cursor-not-allowed
        disabled:hover:shadow-none
        ${fullWidth ? "w-full" : ""}
        ${variants[variant]}
        ${className}
      `}
    >
      {children}
    </button>
  );
}
