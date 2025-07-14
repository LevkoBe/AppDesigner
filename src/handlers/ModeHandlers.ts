import { AppState } from "../state/AppState.ts";
import { DOMManager } from "../ui/DOMManager.ts";
import { Mode, ElementType } from "../types.ts";
import { ElementUtilities } from "./ElementUtilities.ts";

export function handleModeChange(
  mode: Mode,
  state: AppState,
  dom: DOMManager,
  utils: ElementUtilities
): void {
  state.setMode(mode);
  dom.updateCanvasCursor(mode);
  utils.updateStatus();

  if (mode !== "connection") {
    utils.resetConnectionState();
  }

  if (mode === "create") {
    dom.showElementTypeSelection();
  } else {
    dom.hideElementTypeSelection();
  }
}

export function handleElementTypeChange(
  type: ElementType,
  state: AppState,
  utils: ElementUtilities
): void {
  state.setElementType(type);
  utils.updateStatus();
}
