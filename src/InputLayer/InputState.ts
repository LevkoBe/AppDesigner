import { AppElement } from "../_models/AppElement.js";
import { Action, ElementType, Point, Mode } from "../types.js";

export class InputState {
  #action: Action = "none";
  elementType: ElementType = "object";
  currentMode: Mode = "create";
  shiftKey: boolean = false;
  mousePosition?: Point;
  text?: string;
  isEditing: boolean = false;
  dragOffset?: Point;
  activeId?: string;
  secondaryId?: string;
  zoom: number = 1;
  pan: Point = { x: 0, y: 0 };

  get action(): Action {
    return this.#action;
  }

  updateActiveId(elementId?: string) {
    if (!!this.activeId && this.activeId !== elementId) {
      this.secondaryId = this.activeId;
    }
    this.activeId = elementId;
  }

  executeAction(action: Action, text?: string) {
    this.#action = this.validateAction(action);

    switch (this.#action) {
      case "edit":
        this.text = text;
        this.isEditing = true;
        return;
      case "connect":
        return;
      case "zoomIn":
        this.zoom *= 1.2;
        return;
      case "zoomOut":
        this.zoom /= 1.2;
        return;
      case "zoomReset":
        this.zoom = 1;
        this.pan = { x: 0, y: 0 };
        return;
    }

    this.isEditing = false;
    this.text = undefined;
    this.secondaryId = undefined;
  }

  onMouseDown(x: number, y: number, element?: AppElement) {
    this.mousePosition = { x, y };
    this.updateActiveId(element?.id);
    if (element?.id && this.currentMode === "move") {
      this.dragOffset = { x: x - element.x, y: y - element.y };
    }
  }
  onMouseUp() {
    this.dragOffset = undefined;
  }
  onClick(x: number, y: number, elementId?: string) {
    this.mousePosition = { x, y };
    this.updateActiveId(elementId);
    this.executeAction(this.currentMode as Action);
  }
  onDoubleClick(x: number, y: number, elementId?: string) {
    if (elementId) {
      this.mousePosition = { x, y };
      this.activeId = elementId;
      this.executeAction("edit");
    }
  }
  onDrag(elementId: string, x: number, y: number) {
    if (this.currentMode === "move" && this.dragOffset) {
      this.activeId = elementId;
      this.mousePosition = {
        x: x - this.dragOffset.x,
        y: y - this.dragOffset.y,
      };
      this.executeAction("move");
    }
  }

  onContextMenu(x: number, y: number, elementId?: string) {
    if (elementId) {
      this.mousePosition = { x, y };
      this.activeId = elementId;
      this.executeAction("menu");
    }
  }

  setMode(mode: Mode) {
    this.currentMode = mode;
    this.executeAction("mode");
  }
  setElementType(type: ElementType) {
    this.elementType = type;
    this.executeAction("select");
  }

  validateAction(plannedAction: Action): Action {
    switch (plannedAction) {
      case "connect":
        if (
          !this.activeId ||
          !this.secondaryId ||
          this.activeId === this.secondaryId
        )
          return "select";
        return this.shiftKey ? "disconnect" : "connect";
      case "duplicate":
        this.activeId = undefined;
        return "create";
      default:
        return plannedAction;
    }
  }

  clear() {
    this.#action = "none";
  }
}
