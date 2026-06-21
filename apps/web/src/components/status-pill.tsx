import type { ReactNode } from "react";

const toneClasses = {
  neutral: "bg-slate-100 text-slate-700",
  success: "bg-emerald-100 text-emerald-700"
} as const;

type StatusPillProps = {
  children: ReactNode;
  tone?: keyof typeof toneClasses;
};

export function StatusPill({
  children,
  tone = "neutral"
}: StatusPillProps) {
  return (
    <span
      className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] ${toneClasses[tone]}`}
    >
      {children}
    </span>
  );
}
