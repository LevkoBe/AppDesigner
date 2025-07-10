import { ElementType, ElementData } from "../types.ts";

export class Element {
  public id: number;
  public type: ElementType;
  public x: number;
  public y: number;
  public text: string;
  public width: number;
  public height: number;
  public parent: Element | null;
  public children: Element[];
  public connections: Connection[];
  public domElement?: HTMLElement;

  constructor(
    type: ElementType,
    x: number,
    y: number,
    text: string = "",
    parent: Element | null = null
  ) {
    this.id = Date.now() + Math.random();
    this.type = type;
    this.x = x;
    this.y = y;
    this.text = text || this.getDefaultText();
    this.width = this.getDefaultWidth();
    this.height = this.getDefaultHeight();
    this.parent = parent;
    this.children = [];
    this.connections = [];

    if (parent) {
      parent.children.push(this);

      if (type === "input" || type === "output") {
        this.x = parent.x + parent.width + 20;
        this.y = parent.y + (parent.children.length - 1) * 50;
      }
    }
  }

  private getDefaultText(): string {
    const defaults: Record<ElementType, string> = {
      collection: "Collection",
      function: "Function",
      object: "Object",
      input: "Input",
      output: "Output",
    };
    return defaults[this.type] || "Element";
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
      x: this.x,
      y: this.y,
      text: this.text,
      width: this.width,
      height: this.height,
      parent: this.parent ? this.parent.id : null,
      children: this.children.map((child) => child.id),
      connections: this.connections.map((conn) => conn.id),
    };
  }
}

import { Connection } from "./Connection.ts";
