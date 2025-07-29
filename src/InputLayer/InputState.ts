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

  handleAction(action: Action, text?: string) {
    this.#action = action;

    switch (action) {
      case "none":
        return;
      case "edit":
        this.handleEditAction(text);
        return;
      case "connect":
        this.#action = this.handleConnectAction();
        return;
      case "create":
        this.#action = this.handleCreateAction();
        break;
      case "zoomIn":
        this.zoom *= 1.2;
        break;
      case "zoomOut":
        this.zoom /= 1.2;
        break;
      case "zoomReset":
        this.zoom = 1;
        this.pan = { x: 0, y: 0 };
        break;
      case "duplicate":
        action = "create";
        this.activeId = undefined;
        break;
    }

    this.resetState();
  }

  clear() {
    this.#action = "none";
  }

  handleEditAction(text?: string) {
    this.text = text;
    this.isEditing = true;
  }

  resetState() {
    this.isEditing = false;
    this.text = undefined;
    this.secondaryId = undefined;
  }

  handleConnectAction(elementId?: string): Action {
    if (!elementId) {
      this.activeId = undefined;
      return "select";
    }
    const secondary =
      this.activeId !== elementId
        ? this.activeId
        : this.secondaryId !== elementId
        ? this.secondaryId
        : undefined;
    this.activeId = elementId;
    if (!secondary) {
      return "select";
    }
    this.secondaryId = secondary;
    return this.shiftKey ? "disconnect" : "connect";
  }

  handleCreateAction(elementId?: string): Action {
    this.activeId = elementId;
    return elementId && this.shiftKey ? "delete" : "create";
  }

  interpretClick(x: number, y: number, elementId?: string) {
    this.mousePosition = { x, y };
    this.activeId = elementId;

    switch (this.currentMode) {
      case "create":
      case "connect":
      case "edit":
      case "move":
        this.handleAction(this.currentMode);
        break;
    }
    this.activeId = elementId;
  }

  interpretModeChange(mode: Mode) {
    this.currentMode = mode;
    this.handleAction("mode");
  }

  interpretTypeChange(type: ElementType) {
    this.elementType = type;
    this.handleAction("select");
  }

  interpretDrag(elementId: string, mouseX: number, mouseY: number) {
    if (this.currentMode !== "move" || !this.dragOffset) return;
    this.handleAction("move");
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
      this.handleAction("edit");
      this.activeId = elementId;
      this.mousePosition = { x, y };
    }
  }

  interpretContextMenu(e_x: number, e_y: number, elementId?: string) {
    if (elementId || this.activeId) this.handleAction("menu");

    if (elementId) {
      this.activeId = elementId;
      this.mousePosition = { x: e_x, y: e_y };
    }
  }

  interpretActionOnElement(action: Action, elementId?: string) {
    this.activeId = elementId;
    this.handleAction(action);
  }
}
