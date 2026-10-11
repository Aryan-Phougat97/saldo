import type { RiskAssessment } from "../../domain/types";

const STYLES: Record<RiskAssessment["level"], string> = {
  low: "bg-[var(--color-good-bg)] text-[var(--color-good-ink)]",
  medium: "bg-[var(--color-warn-bg)] text-[var(--color-warn-ink)]",
  high: "bg-[var(--color-bad-bg)] text-[var(--color-bad-ink)]",
};

const ICONS: Record<RiskAssessment["level"], string> = {
  low: "●",
  medium: "▲",
  high: "■",
};

/**
 * Named financial risk: level in words plus the plain-language reason.
 * Level is never carried by color alone — text and icon always agree.
 */
export default function RiskBadge({ risk }: { risk: RiskAssessment }) {
  const label = risk.level === "low" ? "Low risk" : risk.level === "medium" ? "Medium risk" : "High risk";
  return (
    <div>
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${STYLES[risk.level]}`}
      >
        <span aria-hidden="true">{ICONS[risk.level]}</span> {label}
      </span>
      <p className="mt-1.5 text-sm text-[var(--color-ink-soft)]">{risk.reason}</p>
    </div>
  );
}
