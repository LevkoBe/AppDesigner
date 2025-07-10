import { Element } from "../models/Element.ts";
import { Connection } from "../models/Connection.ts";
import { ElementType, Mode, Point } from "../types.ts";

export class AppState {
  public currentMode: Mode = "create";
  public currentElementType: ElementType = "collection";
  public elements: Element[] = [];
  public connections: Connection[] = [];
  public selectedElement: Element | null = null;
  public dragging: boolean = false;
  public dragOffset: Point = { x: 0, y: 0 };
  public connectionStart: Element | null = null;
  public zoom: number = 1;
  public pan: Point = { x: 0, y: 0 };
  public contextMenuTarget: Element | null = null;
  public editingElement: Element | null = null;

  public setMode(mode: Mode): void {
    this.currentMode = mode;
  }

  public setElementType(type: ElementType): void {
    this.currentElementType = type;
  }

  public addElement(element: Element): void {
    this.elements.push(element);
  }

  public removeElement(id: number): void {
    const index = this.elements.findIndex((e) => e.id === id);
    if (index !== -1) {
      this.elements.splice(index, 1);
    }
  }

  public addConnection(connection: Connection): void {
    this.connections.push(connection);
  }

  public removeConnection(id: number): void {
    const index = this.connections.findIndex((c) => c.id === id);
    if (index !== -1) {
      this.connections.splice(index, 1);
    }
  }

  public getElementById(id: number): Element | undefined {
    return this.elements.find((e) => e.id === id);
  }

  public getElementAt(x: number, y: number): Element | undefined {
    return this.elements.find((element) => {
      return (
        x >= element.x &&
        x <= element.x + element.width &&
        y >= element.y &&
        y <= element.y + element.height
      );
    });
  }

  public selectElement(element: Element | null): void {
    if (this.selectedElement?.domElement) {
      this.selectedElement.domElement.classList.remove("selected");
    }
    this.selectedElement = element;
    if (element?.domElement) {
      element.domElement.classList.add("selected");
    }
  }

  public clear(): void {
    this.elements.forEach((element) => {
      if (element.domElement) {
        element.domElement.remove();
      }
    });
    this.elements = [];
    this.connections = [];
    this.selectedElement = null;
    this.connectionStart = null;
    this.contextMenuTarget = null;
    this.editingElement = null;
  }
}
