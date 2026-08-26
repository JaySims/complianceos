type AIStatusIndicatorProps = {
  status?: "online" | "thinking" | "offline";
};

export default function AIStatusIndicator({
  status = "online",
}: AIStatusIndicatorProps) {
  const config = {
    online: {
      color: "bg-emerald-400",
      text: "AI ONLINE",
      glow: "shadow-[0_0_30px_rgba(52,211,153,0.6)]",
    },
    thinking: {
      color: "bg-cyan-400",
      text: "AI ANALYSING",
      glow: "shadow-[0_0_30px_rgba(34,211,238,0.6)]",
    },
    offline: {
      color: "bg-rose-400",
      text: "AI OFFLINE",
      glow: "shadow-[0_0_30px_rgba(251,113,133,0.6)]",
    },
  };

  return (
    <div className="inline-flex items-center gap-4 rounded-full border border-white/10 bg-white/[0.05] px-5 py-3 backdrop-blur-xl">

      <div className="relative">

        <span
          className={`block h-3 w-3 rounded-full animate-pulse ${config[status].color} ${config[status].glow}`}
        />

        <span
          className={`absolute inset-0 rounded-full animate-ping ${config[status].color} opacity-40`}
        />

      </div>

      <span className="text-sm font-bold tracking-[0.25em] text-slate-200">
        {config[status].text}
      </span>

    </div>
  );
}