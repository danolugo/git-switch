import { LogicalSize, getCurrentWindow } from "@tauri-apps/api/window";

const STORAGE_KEY = "git-switch:widget-mode";

const FULL_SIZE = { width: 920, height: 640 };
const FULL_MIN = { width: 720, height: 520 };
const WIDGET_SIZE = { width: 340, height: 400 };
const WIDGET_MIN = { width: 300, height: 280 };

export function readWidgetModePreference(): boolean {
  if (typeof localStorage === "undefined") {
    return false;
  }

  return localStorage.getItem(STORAGE_KEY) === "1";
}

export function writeWidgetModePreference(widgetMode: boolean): void {
  localStorage.setItem(STORAGE_KEY, widgetMode ? "1" : "0");
}

export async function applyWindowMode(widgetMode: boolean): Promise<void> {
  const window = getCurrentWindow();

  if (widgetMode) {
    await window.setMinSize(new LogicalSize(WIDGET_MIN.width, WIDGET_MIN.height));
    await window.setSize(new LogicalSize(WIDGET_SIZE.width, WIDGET_SIZE.height));
    return;
  }

  await window.setMinSize(new LogicalSize(FULL_MIN.width, FULL_MIN.height));
  await window.setSize(new LogicalSize(FULL_SIZE.width, FULL_SIZE.height));
}
