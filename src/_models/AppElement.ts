import { ElementType, ElementData } from "../types.ts";
import { Connection } from "./Connection.ts";

export class AppElement {
  id: string;
  text: string;
  size: number;
  strokeWidth: number = 15;
  depth: number = 0;
  widthRatio: number;
  heightRatio: number;
  children: AppElement[];
  connections: Connection[];
  domElement?: HTMLElement;
  isAnchored: boolean;

  private static readonly BASE_SIZE_UNIT = 75;

  constructor(
    public type: ElementType,
    public x: number,
    public y: number,
    public parent: AppElement | undefined = undefined,
    isAnchored: boolean = false
  ) {
    this.id = (Date.now() + Math.random()).toString();
    this.text = this.getDefaultText();
    this.children = [];
    this.connections = [];
    this.isAnchored = isAnchored;

    const { widthRatio, heightRatio } = this.getDefaultRatios();
    this.widthRatio = widthRatio;
    this.heightRatio = heightRatio;
    this.size = AppElement.BASE_SIZE_UNIT;

    this.calculateSize();
    if (parent) {
      this.depth = parent.depth + 1;
      parent.children.push(this);
      parent.calculateSize();
    }
  }

  get width(): number {
    return this.size * this.widthRatio;
  }

  get height(): number {
    return this.size * this.heightRatio;
  }

  public calculateSize(): void {
    if (this.children.length === 0) {
      this.size = AppElement.BASE_SIZE_UNIT;
    } else {
      const totalArea = this.children.reduce(
        (a, b) => a + b.width * b.height,
        0
      );
      const ratioProduct = this.widthRatio * this.heightRatio || 1;
      const estimatedSize = Math.sqrt(totalArea / ratioProduct) * 1.3;

      this.size = Math.max(estimatedSize, AppElement.BASE_SIZE_UNIT);
    }

    const ratioFactor = this.widthRatio / this.heightRatio;
    const sizeFactor = AppElement.BASE_SIZE_UNIT / this.size;
    this.strokeWidth = 15 * Math.pow(sizeFactor, 0.4) * Math.sqrt(ratioFactor);
    this.parent?.calculateSize();
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

  private getDefaultRatios(): { widthRatio: number; heightRatio: number } {
    const defaults: Record<
      ElementType,
      { widthRatio: number; heightRatio: number }
    > = {
      collection: { widthRatio: 1.0, heightRatio: 1.0 },
      function: { widthRatio: 1.2, heightRatio: 0.8 },
      object: { widthRatio: 1.0, heightRatio: 0.8 },
      input: { widthRatio: 0.8, heightRatio: 0.5 },
      output: { widthRatio: 0.8, heightRatio: 0.5 },
    };
    return defaults[this.type] || { widthRatio: 1.0, heightRatio: 1.0 };
  }

  serialize(): ElementData {
    return {
      id: this.id,
      type: this.type,
      x: this.x,
      y: this.y,
      text: this.text,
      parentId: this.parent ? this.parent.id : undefined,
      childIds: this.children.map((child) => child.id),
      connectionIds: this.connections.map((conn) => conn.id),
      isAnchored: this.isAnchored,
    };
  }
}
