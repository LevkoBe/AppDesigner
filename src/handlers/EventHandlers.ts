import { AppState } from "../state/AppState.ts";
import { DOMManager } from "../ui/DOMManager.ts";
import { Element } from "../models/Element.ts";
import { Connection } from "../models/Connection.ts";
import { ElementType, Mode } from "../types.ts";

export class EventHandlers {
  private appState: AppState;
  private domManager: DOMManager;

  constructor(appState: AppState, domManager: DOMManager) {
    this.appState = appState;
    this.domManager = domManager;
  }

  public handleCanvasClick = (e: MouseEvent): void => {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (this.appState.currentMode === "create") {
      const clickedElement = this.appState.getElementAt(x, y);
      if (clickedElement) {
        if (e.shiftKey) {
          this.deleteElementById(clickedElement.id);
        } else {
          this.createChildElement(clickedElement, x, y);
        }
      } else {
        this.createElementAt(x, y);
      }
    } else if (this.appState.currentMode === "connection") {
      const clickedElement = this.appState.getElementAt(x, y);
      if (clickedElement) {
        if (!this.appState.connectionStart) {
          this.appState.connectionStart = clickedElement;
          this.appState.selectElement(clickedElement);
          clickedElement.domElement?.classList.add("connection-source");
          this.updateStatus();
        } else if (clickedElement !== this.appState.connectionStart) {
          this.createConnection(this.appState.connectionStart, clickedElement);
          this.resetConnectionState();
        }
      } else {
        this.resetConnectionState();
      }
    } else if (this.appState.currentMode === "edit") {
      const clickedElement = this.appState.getElementAt(x, y);
      if (clickedElement) {
        this.appState.selectElement(clickedElement);
        this.domManager.editElementText(clickedElement);
      }
    }
  };

  public handleMouseDown = (e: MouseEvent): void => {
    if (this.appState.currentMode === "move") {
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const element = this.appState.getElementAt(x, y);
      if (element) {
        this.appState.dragging = true;
        this.appState.selectElement(element);
        this.appState.dragOffset.x = x - element.x;
        this.appState.dragOffset.y = y - element.y;
        element.domElement?.classList.add("dragging");
      }
    }
  };

  public handleMouseMove = (e: MouseEvent): void => {
    if (
      this.appState.dragging &&
      this.appState.selectedElement &&
      this.appState.currentMode === "move"
    ) {
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      this.appState.selectedElement.x = x - this.appState.dragOffset.x;
      this.appState.selectedElement.y = y - this.appState.dragOffset.y;

      this.domManager.updateElementPosition(this.appState.selectedElement);
      this.domManager.updateConnections(this.appState.connections);
    }
  };

  public handleMouseUp = (): void => {
    if (this.appState.dragging && this.appState.selectedElement) {
      this.appState.dragging = false;
      this.appState.selectedElement.domElement?.classList.remove("dragging");
    }
  };

  public handleContextMenu = (e: MouseEvent): void => {
    e.preventDefault();
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const element = this.appState.getElementAt(x, y);
    if (element) {
      this.appState.contextMenuTarget = element;
      this.domManager.showContextMenu(e.clientX, e.clientY);
    }
  };

  public handleModeChange = (mode: Mode): void => {
    this.appState.setMode(mode);
    this.domManager.updateCanvasCursor(mode);
    this.updateStatus();

    if (mode !== "connection") {
      this.resetConnectionState();
    }
  };

  public handleElementTypeChange = (type: ElementType): void => {
    this.appState.setElementType(type);
    this.updateStatus();
  };

  private createElementAt(
    x: number,
    y: number,
    parent: Element | null = null
  ): Element {
    const element = new Element(
      this.appState.currentElementType,
      x,
      y,
      "",
      parent
    );
    this.appState.addElement(element);
    this.domManager.createElementDOM(element);
    this.appState.selectElement(element);
    this.render();
    return element;
  }

  private createChildElement(parent: Element, x: number, y: number): Element {
    let childX = x;
    let childY = y;

    if (
      this.appState.currentElementType === "input" ||
      this.appState.currentElementType === "output"
    ) {
      childX = parent.x + parent.width + 20;
      childY = parent.y + parent.children.length * 50;
    }

    const child = this.createElementAt(childX, childY, parent);
    return child;
  }

  private deleteElementById(id: number): void {
    const element = this.appState.getElementById(id);
    if (!element) return;

    if (element.parent) {
      element.parent.children = element.parent.children.filter(
        (child) => child.id !== id
      );
    }

    element.children.forEach((child) => {
      this.deleteElementById(child.id);
    });

    this.appState.connections = this.appState.connections.filter(
      (conn) => conn.from.id !== id && conn.to.id !== id
    );

    if (element.domElement) {
      element.domElement.remove();
    }
    this.appState.removeElement(id);

    if (this.appState.selectedElement?.id === id) {
      this.appState.selectedElement = null;
    }

    this.render();
  }

  private createConnection(from: Element, to: Element): void {
    const existingConnection = this.appState.connections.find(
      (conn) =>
        (conn.from.id === from.id && conn.to.id === to.id) ||
        (conn.from.id === to.id && conn.to.id === from.id)
    );

    if (existingConnection) {
      return;
    }

    const connection = new Connection(from, to);
    this.appState.addConnection(connection);
    this.domManager.updateConnections(this.appState.connections);
  }

  private resetConnectionState(): void {
    if (this.appState.connectionStart) {
      this.appState.connectionStart.domElement?.classList.remove(
        "connection-source"
      );
      this.appState.connectionStart = null;
    }
    this.updateStatus();
  }

  private updateStatus(): void {
    const modeText: Record<Mode, string> = {
      create: "Create/Child Mode",
      connection: "Connection Mode",
      move: "Movement Mode",
      edit: "Edit Mode",
    };
    const elementText: Record<ElementType, string> = {
      collection: "Collections",
      function: "Functions",
      object: "Objects",
      input: "Inputs",
      output: "Outputs",
    };

    let statusText = `${modeText[this.appState.currentMode]} - ${
      elementText[this.appState.currentElementType]
    }`;

    if (
      this.appState.currentMode === "connection" &&
      this.appState.connectionStart
    ) {
      statusText += " - Select target element.ts";
    }

    this.domManager.updateStatus(statusText);
  }

  private render(): void {
    this.domManager.updateConnections(this.appState.connections);
  }
}
