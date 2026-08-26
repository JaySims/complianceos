import { ReactNode } from "react";

type GlassPanelProps = {
  children: ReactNode;
  className?: string;
};

export default function GlassPanel({
  children,
  className = "",
}: GlassPanelProps) {
  return (
    <div
      className={`
        relative
        overflow-hidden
        rounded-[32px]
        border
        border-white/10
        bg-white/[0.04]
        backdrop-blur-2xl
        shadow-[0_20px_80px_rgba(37,99,235,0.12)]
        transition-all
        duration-500
        hover:-translate-y-2
        hover:border-cyan-400/30
        hover:shadow-[0_30px_100px_rgba(6,182,212,0.20)]
        ${className}
      `}
    >

      {/* Top Glow */}

      <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />

      {/* Internal Glow */}

      <div className="absolute inset-0 rounded-[32px] bg-gradient-to-br from-white/[0.03] to-transparent pointer-events-none" />

      <div className="relative z-10 p-8">
        {children}
      </div>

    </div>
  );
}