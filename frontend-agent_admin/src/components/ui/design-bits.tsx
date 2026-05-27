import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type Stage = "froid" | "tiede" | "chaud" | "negociation" | "negotiation" | "cloture" | "perdu";

const stageMap: Record<Stage, { label: string; cls: string }> = {
  froid: { label: "Froid", cls: "bg-alice text-eerie" },
  tiede: { label: "Tiède", cls: "bg-honeydew text-eerie" },
  chaud: { label: "Chaud", cls: "bg-vanilla text-eerie" },
  negociation: { label: "Négociation", cls: "bg-[oklch(0.78_0.12_55)] text-eerie" },
  negotiation: { label: "Négociation", cls: "bg-[oklch(0.78_0.12_55)] text-eerie" },
  cloture: { label: "Clôturé", cls: "bg-[oklch(0.7_0.15_145)] text-ghost" },
  perdu: { label: "Perdu", cls: "bg-[oklch(0.75_0.01_270)] text-eerie" },
};

export function StageBadge({ stage, className }: { stage: Stage | string; className?: string }) {
  const s = stageMap[stage as Stage] || { label: stage || "Inconnu", cls: "bg-muted text-foreground" };
  return (
    <span className={cn("inline-flex items-center px-3 py-1 rounded-full text-xs font-medium", s.cls, className)}>
      {s.label}
    </span>
  );
}

export function SoftBadge({ children, tone = "neutral", className }: { children: ReactNode; tone?: "neutral" | "success" | "warn" | "danger" | "info"; className?: string }) {
  const tones = {
    neutral: "bg-muted text-foreground",
    success: "bg-honeydew text-eerie",
    warn: "bg-vanilla text-eerie",
    danger: "bg-destructive/15 text-destructive",
    info: "bg-alice text-eerie",
  };
  const toneCls = tones[tone] || tones.neutral;
  return <span className={cn("inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium", toneCls, className)}>{children}</span>;
}

export function LeadScore({ score, size = 64 }: { score: number; size?: number }) {
  const stroke = 6;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = (score / 100) * c;
  const color =
    score >= 75 ? "oklch(0.78 0.12 55)" : score >= 50 ? "oklch(0.87 0.05 105)" : score >= 25 ? "oklch(0.87 0.03 132)" : "oklch(0.85 0.015 252)";
  return (
    <div className="relative inline-flex" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="oklch(0.92 0.005 270)" strokeWidth={stroke} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none" strokeDasharray={`${dash} ${c}`} strokeLinecap="round" />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-bold text-sm">{score}</span>
    </div>
  );
}

export function Avatar({ name, size = 40, color, className }: { name: string; size?: number; color?: string; className?: string }) {
  const initials = name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  const palette = ["bg-alice", "bg-honeydew", "bg-vanilla", "bg-[oklch(0.85_0.06_30)]", "bg-[oklch(0.82_0.08_280)]"];
  const idx = name.charCodeAt(0) % palette.length;
  return (
    <div
      className={cn("inline-flex items-center justify-center rounded-full font-semibold text-eerie shrink-0", color ?? palette[idx], className)}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {initials}
    </div>
  );
}
