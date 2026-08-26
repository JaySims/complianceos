type SectionHeadingProps = {
  title: string;
  subtitle?: string;
  dark?: boolean;
  align?: "left" | "center";
  className?: string;
};

export default function SectionHeading({
  title,
  subtitle,
  dark = false,
  align = "center",
  className = "",
}: SectionHeadingProps) {
  const alignment =
    align === "left"
      ? "text-left"
      : "text-center";

  const titleColour =
    dark
      ? "text-white"
      : "text-slate-900";

  const subtitleColour =
    dark
      ? "text-slate-300"
      : "text-slate-600";

  return (
    <div
      className={`mx-auto max-w-3xl ${alignment} ${className}`}
    >
      <h2
        className={`text-4xl font-black tracking-tight md:text-5xl ${titleColour}`}
      >
        {title}
      </h2>

      {subtitle && (
        <p
          className={`mt-5 text-lg leading-8 ${subtitleColour}`}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
