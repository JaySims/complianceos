import GlassPanel from "./GlassPanel";

type TimelineNodeProps = {
  step: number;
  title: string;
  description: string;
  active?: boolean;
};

export default function TimelineNode({
  step,
  title,
  description,
  active = false,
}: TimelineNodeProps) {
  return (
    <div className="relative flex gap-8">

      {/* Timeline */}

      <div className="flex flex-col items-center">

        <div
          className={`
            flex h-16 w-16 items-center justify-center
            rounded-full
            border-2
            font-black
            text-xl
            transition-all
            duration-500
            ${
              active
                ? "border-cyan-400 bg-cyan-500 text-white shadow-[0_0_40px_rgba(34,211,238,0.4)]"
                : "border-slate-700 bg-slate-900 text-slate-400"
            }
          `}
        >
          {step}
        </div>

        <div className="mt-2 h-full w-px bg-slate-700" />

      </div>

      <GlassPanel className="flex-1">

        <h3 className="text-2xl font-bold text-white">
          {title}
        </h3>

        <p className="mt-4 leading-8 text-slate-300">
          {description}
        </p>

      </GlassPanel>

    </div>
  );
}