import type { ReactNode } from "react";
import type { ViewName } from "../types";

interface LayoutProps {
  currentView: ViewName;
  onNavigate: (view: ViewName) => void;
  children: ReactNode;
}

const NAV_ITEMS: { id: ViewName; label: string }[] = [
  { id: "dashboard", label: "Dashboard" },
  { id: "profiles", label: "Profiles" },
  { id: "repository", label: "Repository" },
  { id: "settings", label: "Settings" },
];

export function Layout({ currentView, onNavigate, children }: LayoutProps) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">GS</span>
          <div>
            <p className="brand-title">git-switch</p>
            <p className="brand-subtitle">Git identity manager</p>
          </div>
        </div>

        <nav className="nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
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
  );
}
