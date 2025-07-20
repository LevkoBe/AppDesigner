import { AppElement } from "../models/Element.ts";
import { AppState } from "../state/AppState.ts";
import { DOMManager } from "../ui/DOMManager.ts";
import { PropertiesPanel } from "../ui/PropertiesPanel.ts";
import { ElementUtilities } from "./ElementUtilities.ts";

export class ClickHandler {
  constructor(
    private dom: DOMManager,
    private panel: PropertiesPanel,
    private state: AppState,
    private utils: ElementUtilities
  ) {}

  public defineClicked(
    e: MouseEvent
  ): [AppElement | undefined, number, number] {
    const rect = this.dom.getCanvasRect();
    const x = (e.clientX - rect.left) / this.state.zoom - this.state.pan.x;
    const y = (e.clientY - rect.top) / this.state.zoom - this.state.pan.y;
    return [this.state.getElementAt(x, y), x, y];
  }

  public handleCanvasClick(e: MouseEvent): void {
    const [clicked] = this.defineClicked(e);

    if (!clicked && this.state.currentMode !== "connect") {
      this.state.selectElement(undefined);
      this.panel.updatePanel(undefined);
    }

    switch (this.state.currentMode) {
      case "create":
        break;

      case "connect":
        if (clicked) {
          if (!this.state.fromElement) {
            this.state.fromElement = clicked;
            this.state.selectElement(clicked);
            this.panel.updatePanel(clicked);
            clicked.domElement?.classList.add("connection-source");
            this.utils.updateStatus();
          } else if (clicked !== this.state.fromElement) {
            // this.utils.createConnection(this.state.fromElement, clicked);
          }
        }
        break;

      case "edit":
        if (clicked) {
          this.state.selectElement(clicked);
          this.panel.updatePanel(clicked);
          this.dom.editElementText(clicked);
        }
        break;
    }
  }

  public handleMouseDown = (e: MouseEvent) => {
    const [element, x, y] = this.defineClicked(e);
    if (this.state.currentMode === "connect" && !this.state.fromElement) {
      if (element) {
        this.state.fromElement = element;
        this.state.selectElement(element);
        this.panel.updatePanel(element);
        element.domElement?.classList.add("connection-source");
        this.utils.updateStatus();
      }
    }
    if (this.state.currentMode !== "move") return;

    if (element) {
      this.state.dragging = true;
      this.state.selectElement(element);
      this.panel.updatePanel(element);
      this.state.dragOffset.x = x - element.cornerX;
      this.state.dragOffset.y = y - element.cornerY;
      element.domElement?.classList.add("dragging");
      e.preventDefault();
    }
  };

  public handleMouseMove = (e: MouseEvent) => {
    // this.state.selectedElement?.updateCorner(newX, newY); // todo

    // this.dom.updateElementPosition(this.state.selectedElement); // todo
    // this.panel.updatePosition(this.state.selectedElement); // todo

    // this.dom.updateConnections(this.state.connections); // todo

    e.preventDefault();
  };

  public handleMouseUp = () => {
    if (this.state.dragging && this.state.selectedElement) {
      this.state.selectedElement.domElement?.classList.remove("dragging"); // todo
    }
  };
}
