import { ElementType, ElementData } from "../types.ts";
import { Connection } from "./Connection.ts";

export class AppElement {
  public id: string;
  public text: string;
  public width: number;
  public height: number;
  public children: AppElement[];
  public connections: Connection[];
  public domElement?: HTMLElement;

  constructor(
    public type: ElementType,
    public x: number,
    public y: number,
    public parent: AppElement | null = null
  ) {
    this.id = (Date.now() + Math.random()).toString();
    this.type = type;
    this.text = this.getDefaultText();
    this.width = this.getDefaultWidth();
    this.height = this.getDefaultHeight();
    this.x = x;
    this.y = y;
    this.parent = parent;
    this.children = [];
    this.connections = [];

    if (parent) {
      parent.children.push(this);
    }
  }

  // redundant
  public get centerX(): number {
    return this.x;
  }
  public get centerY(): number {
    return this.y;
  }

  public get cornerX(): number {
    return this.x - this.width / 2;
  }

  public get cornerY(): number {
    return this.y - this.height / 2;
  }

  private getDefaultText(): string {
    const defaults: Record<ElementType, string> = {
      collection: "Collection",
      function: "Function",
      object: "Object",
      input: "Input",
      output: "Output",
    };
    return defaults[this.type] || "AppElement";
  }

  private getDefaultWidth(): number {
    const defaults: Record<ElementType, number> = {
      collection: 120,
      function: 100,
      object: 100,
      input: 80,
      output: 80,
    };
    return defaults[this.type] || 100;
  }

  private getDefaultHeight(): number {
    const defaults: Record<ElementType, number> = {
      collection: 80,
      function: 60,
      object: 80,
      input: 40,
      output: 40,
    };
    return defaults[this.type] || 60;
  }

  public serialize(): ElementData {
    return {
      id: this.id,
      type: this.type,
      x: this.centerX,
      y: this.centerY,
      text: this.text,
      width: this.width,
      height: this.height,
      parentId: this.parent ? this.parent.id : null,
      childIds: this.children.map((child) => child.id),
      connectionIds: this.connections.map((conn) => conn.id),
    };
  }
}
