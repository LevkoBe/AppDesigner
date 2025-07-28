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

  handleConnectAction(elementId?: string) {
    if (!elementId) {
      this.activeId = undefined;
      this.setAction("select");
      return;
    }
    const secondary =
      this.activeId !== elementId
        ? this.activeId
        : this.secondaryId !== elementId
        ? this.secondaryId
        : undefined;
    this.activeId = elementId;
    if (!secondary) {
      this.setAction("select");
      return;
    }
    this.secondaryId = secondary;
    this.setAction(this.shiftKey ? "disconnect" : "connect");
    return;
  }

  handleCreateAction(elementId?: string) {
    this.activeId = elementId;
    this.setAction(elementId && this.shiftKey ? "delete" : "create");
  }

  interpretClick(x: number, y: number, elementId?: string) {
    this.mousePosition = { x, y };

    switch (this.currentMode) {
      case "create":
        this.handleCreateAction(elementId);
        return;

      case "connect":
        this.handleConnectAction(elementId);
        break;

      case "edit":
        this.interpretAction(elementId ? "edit" : "none");
        break;

      case "move":
        this.interpretAction(elementId ? "select" : "none");
        break;
    }
    this.activeId = elementId;
  }

  interpretModeChange(mode: Mode) {
    this.currentMode = mode;
    this.interpretAction("mode");
  }

  interpretTypeChange(type: ElementType) {
    this.elementType = type;
    this.interpretAction("select");
  }

  interpretDrag(elementId: string, mouseX: number, mouseY: number) {
    if (this.currentMode !== "move" || !this.dragOffset) return;
    this.interpretAction("move");
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
      this.interpretAction("edit");
      this.activeId = elementId;
      this.mousePosition = { x, y };
    }
  }

  interpretContextMenu(e_x: number, e_y: number, elementId?: string) {
    if (elementId || this.activeId) this.interpretAction("menu");

    if (elementId) {
      this.activeId = elementId;
      this.mousePosition = { x: e_x, y: e_y };
    }
  }

  interpretAction(action: Action) {
    switch (action) {
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
      case "create":
        this.handleCreateAction();
        break;
    }
    this.setAction(action);
  }

  interpretTextEdit(elementId: string, text?: string) {
    this.interpretAction("edit");
    this.activeId = elementId;
    this.text = text;
  }

  interpretActionOnElement(action: Action, elementId?: string) {
    this.activeId = elementId;
    this.interpretAction(action);
  }
}
