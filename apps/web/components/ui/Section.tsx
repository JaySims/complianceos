type SectionProps = {
  children: React.ReactNode;
  className?: string;
};

export default function Section({
  children,
  className = "",
}: SectionProps) {
  return (
    <section
      className={`
        relative
        overflow-hidden
        py-32
        ${className}
      `}
    >
      {/* Background */}

      <div className="absolute inset-0 -z-10">

        {/* Main Glow */}

        <div className="absolute left-1/2 top-0 h-[900px] w-[900px] -translate-x-1/2 rounded-full bg-blue-500/10 blur-[220px]" />

        {/* Right Glow */}

        <div className="absolute right-0 top-24 h-[550px] w-[550px] rounded-full bg-cyan-400/8 blur-[180px]" />

        {/* Left Glow */}

        <div className="absolute left-0 bottom-0 h-[500px] w-[500px] rounded-full bg-indigo-500/8 blur-[180px]" />

        {/* Grid */}

        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `
              linear-gradient(to right, white 1px, transparent 1px),
              linear-gradient(to bottom, white 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
          }}
        />

        {/* Fade */}

        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-950/30 to-slate-950" />

      </div>

      {children}

    </section>
  );
}