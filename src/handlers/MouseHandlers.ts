import { AppState } from "../state/AppState.ts";
import { DOMManager } from "../ui/DOMManager.ts";
import { PropertiesPanel } from "../ui/PropertiesPanel.ts";

/**
 * Manages dragging of elements
 */
export class MouseHandlers {
  constructor(
    private state: AppState,
    private panel: PropertiesPanel,
    private dom: DOMManager
  ) {}

  public handleMouseDown = (e: MouseEvent) => {
    if (this.state.currentMode !== "move") return;

    const rect = this.dom.getCanvasRect();
    const x = (e.clientX - rect.left) / this.state.zoom - this.state.pan.x;
    const y = (e.clientY - rect.top) / this.state.zoom - this.state.pan.y;
    const element = this.state.getElementAt(x, y);

    if (element) {
      this.state.dragging = true;
      this.state.selectElement(element);
      this.panel.updatePanel(element);
      this.state.dragOffset.x = x - element.x;
      this.state.dragOffset.y = y - element.y;
      element.domElement?.classList.add("dragging");
      e.preventDefault();
    }
  };

  public handleMouseMove = (e: MouseEvent) => {
    if (
      !this.state.dragging ||
      !this.state.selectedElement ||
      this.state.currentMode !== "move"
    )
      return;

    const rect = this.dom.getCanvasRect();
    const x = (e.clientX - rect.left) / this.state.zoom - this.state.pan.x;
    const y = (e.clientY - rect.top) / this.state.zoom - this.state.pan.y;

    const newX = x - this.state.dragOffset.x;
    const newY = y - this.state.dragOffset.y;

    this.state.selectedElement.x = newX;
    this.state.selectedElement.y = newY;

    this.dom.updateElementPosition(this.state.selectedElement);
    this.panel.updatePosition(this.state.selectedElement);

    this.dom.updateConnections(this.state.connections);

    e.preventDefault();
  };

  public handleMouseUp = () => {
    if (this.state.dragging && this.state.selectedElement) {
      this.state.dragging = false;
      this.state.selectedElement.domElement?.classList.remove("dragging");
    }
  };
}
