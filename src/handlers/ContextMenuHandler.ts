import { AppState } from "../state/AppState.ts";
import { DOMManager } from "../ui/DOMManager.ts";

export function handleContextMenu(
  e: MouseEvent,
  state: AppState,
  dom: DOMManager
): void {
  e.preventDefault();
  const rect = dom.getCanvasRect();
  const x = (e.clientX - rect.left) / state.zoom - state.pan.x;
  const y = (e.clientY - rect.top) / state.zoom - state.pan.y;
  const element = state.getElementAt(x, y);
  if (element) {
    state.contextMenuTarget = element;
    dom.showContextMenu(e.clientX, e.clientY);
  }
}
