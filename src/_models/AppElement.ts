import { ElementType, ElementData } from "../types.ts";
import { Connection } from "./Connection.ts";

export class AppElement {
  id: string;
  text: string;
  width: number;
  height: number;
  children: AppElement[];
  connections: Connection[];
  domElement?: HTMLElement;
  isAnchored: boolean;

  constructor(
    public type: ElementType,
    public x: number,
    public y: number,
    public parent: AppElement | undefined = undefined,
    isAnchored: boolean = false
  ) {
    this.id = (Date.now() + Math.random()).toString();
    this.text = this.getDefaultText();
    this.width = this.getDefaultWidth();
    this.height = this.getDefaultHeight();
    this.children = [];
    this.connections = [];
    this.isAnchored = isAnchored;

    if (parent) {
      parent.children.push(this);
    }
  }

  get cornerX(): number {
    return this.x - this.width / 2;
  }

  get cornerY(): number {
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
      collection: 90,
      function: 100,
      object: 90,
      input: 80,
      output: 80,
    };
    return defaults[this.type] || 100;
  }

  private getDefaultHeight(): number {
    const defaults: Record<ElementType, number> = {
      collection: 90,
      function: 60,
      object: 78,
      input: 40,
      output: 40,
    };
    return defaults[this.type] || 60;
  }

  serialize(): ElementData {
    return {
      id: this.id,
      type: this.type,
      x: this.x,
      y: this.y,
      text: this.text,
      width: this.width,
      height: this.height,
      parentId: this.parent ? this.parent.id : undefined,
      childIds: this.children.map((child) => child.id),
      connectionIds: this.connections.map((conn) => conn.id),
      isAnchored: this.isAnchored,
    };
  }
}
