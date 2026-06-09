import type { ReactNode } from "react";
import type { ViewName } from "../types";

interface LayoutProps {
  currentView: ViewName;
  onNavigate: (view: ViewName) => void;
  children: ReactNode;
}

const NAV_ITEMS: { id: ViewName; label: string }[] = [
  { id: "dashboard", label: "dashboard" },
  { id: "profiles", label: "profiles" },
  { id: "repository", label: "repo" },
  { id: "settings", label: "settings" },
];

const LOGO = [
  "┌─┐┬┌┬┐   ┌─┐┬ ┬┬┌┬┐┌─┐┬ ┬",
  "│ ┬│ │    └─┐│││││ ││  ├─┤",
  "└─┘┴ ┴ ────└─┘└┴┘┴ ┴└─┘┴ ┴",
].join("\n");

export function Layout({ currentView, onNavigate, children }: LayoutProps) {
  return (
    <>
      <div className="crt" aria-hidden="true" />
      <div className="app-shell">
        <aside className="sidebar">
          <div className="brand">
            <pre className="brand-ascii" aria-label="git-switch">
              {LOGO}
            </pre>
            <div className="brand-meta">
              <p className="brand-title">git-switch</p>
              <p className="brand-status">[ ONLINE ] v0.1.0</p>
            </div>
          </div>

          <nav className="nav" aria-label="Primary">
            <p className="nav-label">// NAVIGATION</p>
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-current={currentView === item.id ? "page" : undefined}
                className={`nav-item ${currentView === item.id ? "active" : ""}`}
                onClick={() => onNavigate(item.id)}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        <main className="content">{children}</main>
      </div>
    </>
  );
}
