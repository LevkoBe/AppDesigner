import { AppElement } from "../models/Element.ts";
import { Connection } from "../models/Connection.ts";
import {
  ConnectionData,
  ElementData,
  ElementType,
  Mode,
  Point,
} from "../types.ts";

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

  selectElement(element: AppElement | undefined): void {
    if (this.selectedElement?.domElement) {
      this.selectedElement.domElement.classList.remove("selected");
    }
    this.selectedElement = element;
    if (element?.domElement) {
      element.domElement.classList.add("selected");
    }
  }

  hasConnection(fromId: string, toId: string): boolean {
    return this.connections.some(
      (conn) =>
        (conn.from.id === fromId && conn.to.id === toId) ||
        (conn.from.id === toId && conn.to.id === fromId)
    );
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

    const elementMap = new Map<string, AppElement>();
    const parentChildMap = new Map<string, string>();

    this.elements = data.elements.map((elementData: ElementData) => {
      const element = new AppElement(
        elementData.type,
        elementData.x,
        elementData.y
      );
      element.id = elementData.id;
      element.text = elementData.text;
      element.width = elementData.width;
      element.height = elementData.height;

      elementMap.set(element.id, element);

      if (elementData.parentId) {
        parentChildMap.set(element.id, elementData.parentId);
      }

      return element;
    });

    for (const [childId, parentId] of parentChildMap) {
      const child = elementMap.get(childId);
      const parent = elementMap.get(parentId);

      if (child && parent) {
        child.parent = parent;
        if (!parent.children.includes(child)) {
          parent.children.push(child);
        }
      }
    }

    this.connections = data.connections.map(
      (connectionData: ConnectionData) => {
        const from = this.getElementById(connectionData.from);
        const to = this.getElementById(connectionData.to);

        if (!from || !to) {
          throw new Error(
            `Invalid connection: missing element (from: ${connectionData.from}, to: ${connectionData.to})`
          );
        }

        const connection = new Connection(from, to);
        connection.id = connectionData.id;
        return connection;
      }
    );
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
