import { AppElement } from "../_models/AppElement.js";
import { Action, ElementType, Point, Mode } from "../types.js";

export class InputState {
  #action: Action = "none";

  elementType: ElementType = "object";
  currentMode: Mode = "create";
  shiftKey: boolean = false;
  mousePosition?: { x: number; y: number };
  text?: string;
  isEditing: boolean = false;
  dragOffset?: { x: number; y: number };
  secondaryId?: string;
  activeId?: string;
  zoom: number = 1;
  pan: Point = { x: 0, y: 0 };

  constructor() {}

  get getAction(): Action {
    return this.#action;
  }

  setAction(action: Action) {
    this.#action = action;
    if (action === "edit") this.isEditing = true;
    else if (action !== "none") {
      this.isEditing = false;
      this.text = undefined;
      if (action !== "connect") this.secondaryId = undefined;
    }
  }

  clear() {
    this.setAction("none");
  }

  interpretClick(
    x: number,
    y: number,
    elementId?: string,
    shiftKey: boolean = false
  ) {
    this.mousePosition = { x, y };
    this.shiftKey = shiftKey;

    switch (this.currentMode) {
      case "create":
        this.setAction(elementId && shiftKey ? "delete" : "create");
        this.activeId = elementId;
        return;

      case "connect": {
        if (!elementId) {
          this.activeId = undefined;
          this.setAction("select");
          return;
        }
        const secondary =
          this.secondaryId !== elementId
            ? this.secondaryId
            : this.activeId !== elementId
            ? this.activeId
            : undefined;
        if (!secondary) {
          this.setAction("select");
          break;
        }
        this.secondaryId = secondary;
        this.setAction("connect");
        break;
      }

      case "edit":
        this.setAction(elementId ? "edit" : "none");
        break;

      case "move":
        this.setAction(elementId ? "select" : "none");
        break;
    }
    this.activeId = elementId;
  }

  resetConnectionState() {
    this.secondaryId = undefined;
    if (this.currentMode === "connect") {
      this.activeId = undefined;
      this.setAction("none");
    }
  }

  interpretModeChange(mode: Mode) {
    this.currentMode = mode;
    this.setAction("changeMode");
  }

  interpretDrag(elementId: string, mouseX: number, mouseY: number) {
    if (this.currentMode !== "move" || !this.dragOffset) return;
    this.setAction("move");
    const x = mouseX - this.dragOffset.x;
    const y = mouseY - this.dragOffset.y;
    this.secondaryId = elementId;
    this.mousePosition = { x, y };
  }

  interpretMouseDown(x: number, y: number, element?: AppElement) {
    this.text = undefined;

    this.mousePosition = { x, y };

    this.secondaryId = element?.id;
    if (element && this.currentMode === "move") {
      this.dragOffset = {
        x: x - element.x,
        y: y - element.y,
      };
    }
  }

  interpretMouseUp() {
    if (this.currentMode === "move") {
      this.dragOffset = undefined;
    }
  }

  interpretDoubleClick(x: number, y: number, elementId?: string) {
    if (elementId) {
      this.setAction("edit");
      this.activeId = elementId;
      this.mousePosition = { x, y };
    }
  }

  interpretContextMenu(e_x: number, e_y: number, elementId?: string) {
    if (elementId || this.activeId) this.setAction("menu");

    if (elementId) {
      this.activeId = elementId;
      this.mousePosition = { x: e_x, y: e_y };
    }
  }

  interpretContextMenuOption(option: Action) {
    if (!this.activeId) return;
    this.setAction(option);
    switch (option) {
      case "duplicate":
        this.setAction("create");
        this.activeId = undefined;
        break;
      default:
        this.setAction(option);
    }
  }

  interpretControlsAction(action: Action) {
    this.setAction(action);
    switch (action) {
      case "zoomIn":
        this.zoom *= 1.2;
        break;
      case "zoomOut":
        this.zoom /= 1.2;
        break;
      case "resetView":
        this.zoom = 1;
        this.pan = { x: 0, y: 0 };
        break;
    }
  }

  interpretTextEdit(elementId: string, text?: string) {
    this.setAction("edit");
    this.activeId = elementId;
    this.text = text;
  }

  interpretActionOnElement(action: Action, elementId?: string) {
    this.activeId = elementId;
    switch (action) {
      case "delete":
        this.setAction("delete");
        this.activeId = elementId;
        break;
      case "anchor":
        this.setAction("anchor");
        break;
      case "select":
        break;
    }
  }
}
