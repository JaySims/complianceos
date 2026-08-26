type GradientHeadingProps = {
  badge?: string;
  title: string;
  highlight?: string;
  description?: string;
  align?: "left" | "center";
};

export default function GradientHeading({
  badge,
  title,
  highlight,
  description,
  align = "center",
}: GradientHeadingProps) {
  const alignment =
    align === "left" ? "text-left" : "text-center";

  return (
    <div className={`mx-auto max-w-5xl ${alignment}`}>

      {badge && (
        <div className="inline-flex items-center rounded-full border border-cyan-500/20 bg-cyan-500/10 px-6 py-2 backdrop-blur-xl">
          <span className="text-sm font-semibold uppercase tracking-[0.30em] text-cyan-300">
            {badge}
          </span>
        </div>
      )}

      <h2 className="mt-8 text-5xl font-black leading-tight tracking-tight text-white md:text-7xl">

        {title}

        {highlight && (
          <>
            <br />

            <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-emerald-400 bg-clip-text text-transparent">
              {highlight}
            </span>
          </>
        )}

      </h2>

      {description && (
        <p className="mx-auto mt-8 max-w-4xl text-xl leading-9 text-slate-300">
          {description}
        </p>
      )}

    </div>
  );
}