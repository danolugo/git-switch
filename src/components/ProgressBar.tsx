interface ProgressBarProps {
  value: number;
  max?: number;
  /** Number of cells in the bar. */
  width?: number;
  /** Show the trailing percentage. */
  showPercent?: boolean;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Raw ASCII data viz: [||||||||......] 60% */
export function ProgressBar({
  value,
  max = 100,
  width = 14,
  showPercent = true,
}: ProgressBarProps) {
  const ratio = max <= 0 ? 0 : clamp(value / max, 0, 1);
  const filled = Math.round(width * ratio);
  const percent = Math.round(ratio * 100);

  return (
    <span
      className="progress"
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      [<span className="bars">{"|".repeat(filled)}</span>
      <span className="bars-empty">{".".repeat(width - filled)}</span>]
      {showPercent ? <span className="pct"> {percent}%</span> : null}
    </span>
  );
}
