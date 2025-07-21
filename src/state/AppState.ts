import { AppElement } from "../models/Element.ts";
import { Connection } from "../models/Connection.ts";
import { ElementType, Mode, Point } from "../types.ts";

export class AppState {
  currentMode: Mode = "create";
  currentElementType: ElementType = "object";
  elements: AppElement[] = [];
  connections: Connection[] = [];
  selectedElement: AppElement | undefined;
  dragging: boolean = false;
  fromElement: AppElement | undefined;
  zoom: number = 1;
  pan: Point = { x: 0, y: 0 };
  editingElement: AppElement | undefined;
  contextMenu: boolean = false;
  targetPosition?: Point;
  rerenderNeeded: boolean = false;
  autoLayout: boolean = true;

  setMode(mode: Mode): void {
    this.currentMode = mode;
  }

  setElementType(type: ElementType): void {
    this.currentElementType = type;
  }

  addElement(element: AppElement): void {
    this.elements.push(element);
  }

  removeElement(id: string): void {
    const index = this.elements.findIndex((e) => e.id === id);
    if (index !== -1) {
      this.elements.splice(index, 1);
    }
  }

  addConnection(connection: Connection): void {
    this.connections.push(connection);
  }

  removeConnection(id: string): void {
    const index = this.connections.findIndex((c) => c.id === id);
    if (index !== -1) {
      this.connections.splice(index, 1);
    }
  }

  removeConnectionsFor(id: string): void {
    this.connections = this.connections.filter(
      (conn) => conn.from.id !== id && conn.to.id !== id
    );
  }

  getElementById(id: string): AppElement | undefined {
    return this.elements.find((e) => e.id === id);
  }

  getElementAt(x: number, y: number): AppElement | undefined {
    return this.elements.find((element) => {
      return (
        x >= element.cornerX &&
        x <= element.cornerX + element.width &&
        y >= element.cornerY &&
        y <= element.cornerY + element.height
      );
    });
  }

  selectElement(element: AppElement | undefined): void {
    if (this.selectedElement?.domElement) {
      this.selectedElement.domElement.classList.remove("selected");
    }
    this.selectedElement = element;
    if (element?.domElement) {
      element.domElement.classList.add("selected");
    }
  }

  serialize(): string {
    return JSON.stringify({
      elements: this.elements.map((e) => e.serialize()),
      connections: this.connections.map((c) => c.serialize()),
    });
  }

  deserialize(json: string): void {
    const data = JSON.parse(json);

    this.clear();

    this.elements = data.elements.map((e: AppElement) => {
      const element = new AppElement(e.type, e.x, e.y, e.parent);
      element.id = e.id;
      element.width = e.width;
      element.height = e.height;
      return element;
    });

    this.connections = data.connections.map((c: Connection) => {
      const from = this.getElementById(c.from.id);
      const to = this.getElementById(c.to.id);
      if (!from || !to) throw new Error("Invalid connection: missing element");
      return new Connection(from, to);
    });
  }

  clear(): void {
    this.elements = [];
    this.connections = [];
    this.selectedElement = undefined;
    this.dragging = false;
    this.fromElement = undefined;
    this.zoom = 1;
    this.pan = { x: 0, y: 0 };
    this.editingElement = undefined;
    this.contextMenu = false;
    this.targetPosition = undefined;
  }
}
