import { AppElement } from "../models/Element.ts";
import { Connection } from "../models/Connection.ts";
import { ElementType, Mode, Point } from "../types.ts";

export class AppState {
  public currentMode: Mode = "create";
  public currentElementType: ElementType = "object";
  public elements: AppElement[] = [];
  public connections: Connection[] = [];
  public selectedElement: AppElement | undefined = undefined;
  public dragging: boolean = false;
  public dragOffset: Point = { x: 0, y: 0 };
  public fromElement: AppElement | undefined = undefined;
  public zoom: number = 1;
  public pan: Point = { x: 0, y: 0 };
  public editingElement: AppElement | undefined = undefined;

  public setMode(mode: Mode): void {
    this.currentMode = mode;
  }

  public setElementType(type: ElementType): void {
    this.currentElementType = type;
  }

  public addElement(element: AppElement): void {
    this.elements.push(element);
  }

  public removeElement(id: string): void {
    const index = this.elements.findIndex((e) => e.id === id);
    if (index !== -1) {
      this.elements.splice(index, 1);
    }
  }

  public addConnection(connection: Connection): void {
    this.connections.push(connection);
  }

  public removeConnection(id: string): void {
    const index = this.connections.findIndex((c) => c.id === id);
    if (index !== -1) {
      this.connections.splice(index, 1);
    }
  }

  public getElementById(id: string): AppElement | undefined {
    return this.elements.find((e) => e.id === id);
  }

  public getElementAt(x: number, y: number): AppElement | undefined {
    return this.elements.find((element) => {
      return (
        x >= element.cornerX &&
        x <= element.cornerX + element.width &&
        y >= element.cornerY &&
        y <= element.cornerY + element.height
      );
    });
  }

  public selectElement(element: AppElement | undefined): void {
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
    this.elements = data.elements.map(
      (e: AppElement) => new AppElement(e.type, e.x, e.y, e.parent)
    );
    this.connections = data.connections.map(
      (c: Connection) => new Connection(c.from, c.to)
    );
  }
}
