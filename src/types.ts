export type ElementType =
  | "collection"
  | "function"
  | "object"
  | "input"
  | "output";
export type Mode = "create" | "connect" | "move" | "edit";

export interface ElementData {
  id: number;
  type: ElementType;
  x: number;
  y: number;
  text: string;
  width: number;
  height: number;
  parent: number | null;
  children: number[];
  connections: number[];
}

export interface ConnectionData {
  id: number;
  from: number;
  to: number;
}

export interface ProjectData {
  elements: ElementData[];
  connections: ConnectionData[];
}

export interface Point {
  x: number;
  y: number;
}
