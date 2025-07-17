import { ElementType, ElementData, Point } from "../types.ts";
import { Connection } from "./Connection.ts";

export class AppElement {
  public id: number;
  public type: ElementType;
  public text: string;
  public width: number;
  public height: number;
  public parent: AppElement | null;
  public children: AppElement[];
  public connections: Connection[];
  public domElement?: HTMLElement;

  private _centerX: number;
  private _centerY: number;

  constructor(
    type: ElementType,
    centerX: number,
    centerY: number,
    text: string = "",
    parent: AppElement | null = null
  ) {
    this.id = Date.now() + Math.random();
    this.type = type;
    this.text = text || this.getDefaultText();
    this.width = this.getDefaultWidth();
    this.height = this.getDefaultHeight();
    this._centerX = centerX;
    this._centerY = centerY;
    this.parent = parent;
    this.children = [];
    this.connections = [];

    if (parent) {
      parent.children.push(this);
    }
  }

  public get centerX(): number {
    return this._centerX;
  }

  public get centerY(): number {
    return this._centerY;
  }

  public get cornerX(): number {
    return this._centerX - this.width / 2;
  }

  public get cornerY(): number {
    return this._centerY - this.height / 2;
  }

  public getCenter(): Point {
    return { x: this._centerX, y: this._centerY };
  }

  public updateCenter(x: number, y: number): void {
    this._centerX = x;
    this._centerY = y;
  }

  public updateCorner(x: number, y: number): void {
    this._centerX = x + this.width / 2;
    this._centerY = y + this.height / 2;
  }

  // New method to allow layout systems to update position
  public setCenter(x: number, y: number): void {
    this._centerX = x;
    this._centerY = y;
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
      parent: this.parent ? this.parent.id : null,
      children: this.children.map((child) => child.id),
      connections: this.connections.map((conn) => conn.id),
    };
  }
}
