import { AppState } from "../state/AppState.ts";
import { DOMManager } from "../ui/DOMManager.ts";
import { Element } from "../models/Element.ts";
import { Connection } from "../models/Connection.ts";
import { ElementType, Mode } from "../types.ts";
import { PropertiesPanel } from "../ui/PropertiesPanel.ts";

export class EventHandlers {
  private appState: AppState;
  private domManager: DOMManager;
  private propertiesPanel: PropertiesPanel;

  constructor(
    appState: AppState,
    domManager: DOMManager,
    propertiesPanel: PropertiesPanel
  ) {
    this.appState = appState;
    this.domManager = domManager;
    this.propertiesPanel = propertiesPanel;
  }

  public handleCanvasClick = (e: MouseEvent): void => {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    // Apply inverse zoom and pan transformations to get accurate coordinates
    const x =
      (e.clientX - rect.left) / this.appState.zoom - this.appState.pan.x;
    const y = (e.clientY - rect.top) / this.appState.zoom - this.appState.pan.y;
    const clickedElement = this.appState.getElementAt(x, y);

    if (!clickedElement && this.appState.currentMode !== "connection") {
      this.appState.selectElement(null);
      this.propertiesPanel.updatePanel(null);
    }

    if (this.appState.currentMode === "create") {
      if (clickedElement) {
        if (e.shiftKey) {
          this.deleteElementById(clickedElement.id);
        } else {
          this.createChildElement(clickedElement);
        }
      } else {
        this.createElementAt(x, y);
      }
    } else if (this.appState.currentMode === "connection") {
      if (clickedElement) {
        if (!this.appState.connectionStart) {
          this.appState.connectionStart = clickedElement;
          this.appState.selectElement(clickedElement);
          this.propertiesPanel.updatePanel(clickedElement);
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
      if (clickedElement) {
        this.appState.selectElement(clickedElement);
        this.propertiesPanel.updatePanel(clickedElement);
        this.domManager.editElementText(clickedElement);
      }
    }
  };

  public handleMouseDown = (e: MouseEvent): void => {
    if (this.appState.currentMode === "move") {
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      // Apply inverse zoom and pan transformations
      const x =
        (e.clientX - rect.left) / this.appState.zoom - this.appState.pan.x;
      const y =
        (e.clientY - rect.top) / this.appState.zoom - this.appState.pan.y;

      const element = this.appState.getElementAt(x, y);
      if (element) {
        this.appState.dragging = true;
        this.appState.selectElement(element);
        this.propertiesPanel.updatePanel(element);
        this.appState.dragOffset.x = x - element.x;
        this.appState.dragOffset.y = y - element.y;
        element.domElement?.classList.add("dragging");

        // Prevent default to avoid text selection
        e.preventDefault();
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
      // Apply inverse zoom and pan transformations
      const x =
        (e.clientX - rect.left) / this.appState.zoom - this.appState.pan.x;
      const y =
        (e.clientY - rect.top) / this.appState.zoom - this.appState.pan.y;

      const newX = x - this.appState.dragOffset.x;
      const newY = y - this.appState.dragOffset.y;

      this.appState.selectedElement.x = newX;
      this.appState.selectedElement.y = newY;

      this.domManager.updateElementPosition(this.appState.selectedElement);
      this.propertiesPanel.updatePosition(this.appState.selectedElement);

      // Update children positions if they exist
      this.updateChildrenPositions(this.appState.selectedElement);

      this.domManager.updateConnections(this.appState.connections);

      // Prevent default to avoid text selection
      e.preventDefault();
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
    // Apply inverse zoom and pan transformations
    const x =
      (e.clientX - rect.left) / this.appState.zoom - this.appState.pan.x;
    const y = (e.clientY - rect.top) / this.appState.zoom - this.appState.pan.y;

    const element = this.appState.getElementAt(x, y);
    if (element) {
      this.appState.contextMenuTarget = element;
      // Use original client coordinates for context menu positioning
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
    this.propertiesPanel.updatePanel(element);
    this.render();
    return element;
  }

  private createChildElement(parent: Element): Element {
    const childX = parent.x + parent.width + 30;
    const childY = parent.y + parent.children.length * 55;

    const child = this.createElementAt(childX, childY, parent);
    return child;
  }

  private updateChildrenPositions(element: Element): void {
    // Update positions of all children recursively
    element.children.forEach((child) => {
      this.domManager.updateElementPosition(child);
      this.updateChildrenPositions(child);
    });
  }

  private deleteElementById(id: number): void {
    const element = this.appState.getElementById(id);
    if (!element) return;

    // Remove from parent's children array
    if (element.parent) {
      element.parent.children = element.parent.children.filter(
        (child) => child.id !== id
      );
    }

    // Recursively delete all children
    element.children.forEach((child) => {
      this.deleteElementById(child.id);
    });

    // Remove all connections involving this element
    this.appState.connections = this.appState.connections.filter(
      (conn) => conn.from.id !== id && conn.to.id !== id
    );

    // Remove DOM element
    if (element.domElement) {
      element.domElement.remove();
    }

    // Remove from app state
    this.appState.removeElement(id);

    // Clear selection if this element was selected
    if (this.appState.selectedElement?.id === id) {
      this.appState.selectedElement = null;
      this.propertiesPanel.updatePanel(null);
    }

    // Clear connection start if this element was the connection start
    if (this.appState.connectionStart?.id === id) {
      this.appState.connectionStart = null;
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
      statusText += " - Select target element";
    }

    this.domManager.updateStatus(statusText);
  }

  private render(): void {
    this.domManager.updateConnections(this.appState.connections);
  }
}
