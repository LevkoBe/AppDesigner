import { AppState } from "../state/AppState.ts";
import { DOMManager } from "../ui/DOMManager.ts";
import { PropertiesPanel } from "../ui/PropertiesPanel.ts";
import { ElementUtilities } from "./ElementUtilities.ts";

export function handleCanvasClick(
  e: MouseEvent,
  state: AppState,
  dom: DOMManager,
  panel: PropertiesPanel,
  utils: ElementUtilities
): void {
  const rect = (e.target as HTMLElement).getBoundingClientRect();
  const x = (e.clientX - rect.left) / state.zoom - state.pan.x;
  const y = (e.clientY - rect.top) / state.zoom - state.pan.y;
  const clicked = state.getElementAt(x, y);

  if (!clicked && state.currentMode !== "connection") {
    state.selectElement(null);
    panel.updatePanel(null);
  }

  switch (state.currentMode) {
    case "create":
      if (clicked) {
        if (e.shiftKey) utils.deleteElementById(clicked.id);
        else utils.createChildElement(clicked);
      } else {
        utils.createElementAt(x, y);
      }
      break;

    case "connection":
      if (clicked) {
        if (!state.connectionStart) {
          state.connectionStart = clicked;
          state.selectElement(clicked);
          panel.updatePanel(clicked);
          clicked.domElement?.classList.add("connection-source");
          utils.updateStatus();
        } else if (clicked !== state.connectionStart) {
          utils.createConnection(state.connectionStart, clicked);
          utils.resetConnectionState();
        }
      } else utils.resetConnectionState();
      break;

    case "edit":
      if (clicked) {
        state.selectElement(clicked);
        panel.updatePanel(clicked);
        dom.editElementText(clicked);
      }
      break;
  }
}
