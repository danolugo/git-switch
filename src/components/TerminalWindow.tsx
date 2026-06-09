import type { ReactNode } from "react";

interface TerminalWindowProps {
  title: string;
  /** Right-aligned flag text in the title bar, e.g. "--status". */
  flag?: string;
  /** Amber title bar for warnings/secondary panes. */
  tone?: "primary" | "amber";
  className?: string;
  children: ReactNode;
}

export function TerminalWindow({
  title,
  flag,
  tone = "primary",
  className,
  children,
}: TerminalWindowProps) {
  return (
    <section className={`window ${className ?? ""}`.trim()}>
      <header className={`window-bar ${tone === "amber" ? "amber" : ""}`.trim()}>
        <span className="window-dot" aria-hidden="true" />
        <span className="window-title">{title}</span>
        {flag ? <span className="window-flag">{flag}</span> : null}
      </header>
      <div className="window-body">{children}</div>
    </section>
  );
}
