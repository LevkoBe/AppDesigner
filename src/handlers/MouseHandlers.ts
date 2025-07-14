import { AppElement } from "../main.ts";
import { AppState } from "../state/AppState.ts";
import { DOMManager } from "../ui/DOMManager.ts";
import { PropertiesPanel } from "../ui/PropertiesPanel.ts";

export function handleMouseDown(
  e: MouseEvent,
  state: AppState,
  dom: DOMManager,
  panel: PropertiesPanel
): void {
  if (state.currentMode !== "move") return;

  const rect = (e.target as HTMLElement).getBoundingClientRect();
  const x = (e.clientX - rect.left) / state.zoom - state.pan.x;
  const y = (e.clientY - rect.top) / state.zoom - state.pan.y;
  const element = state.getElementAt(x, y);

  if (element) {
    state.dragging = true;
    state.selectElement(element);
    panel.updatePanel(element);
    state.dragOffset.x = x - element.x;
    state.dragOffset.y = y - element.y;
    element.domElement?.classList.add("dragging");
    e.preventDefault();
  }
}

export function handleMouseMove(
  e: MouseEvent,
  state: AppState,
  dom: DOMManager,
  panel: PropertiesPanel
): void {
  if (!state.dragging || !state.selectedElement || state.currentMode !== "move")
    return;

  const rect = (e.target as HTMLElement).getBoundingClientRect();
  const x = (e.clientX - rect.left) / state.zoom - state.pan.x;
  const y = (e.clientY - rect.top) / state.zoom - state.pan.y;

  const newX = x - state.dragOffset.x;
  const newY = y - state.dragOffset.y;

  state.selectedElement.x = newX;
  state.selectedElement.y = newY;

  dom.updateElementPosition(state.selectedElement);
  panel.updatePosition(state.selectedElement);

  updateChildrenRecursive(state.selectedElement, dom);
  dom.updateConnections(state.connections);

  e.preventDefault();
}

function updateChildrenRecursive(element: AppElement, dom: DOMManager) {
  element.children.forEach((child) => {
    dom.updateElementPosition(child);
    updateChildrenRecursive(child, dom);
  });
}

export function handleMouseUp(state: AppState): void {
  if (state.dragging && state.selectedElement) {
    state.dragging = false;
    state.selectedElement.domElement?.classList.remove("dragging");
  }
}
