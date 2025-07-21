export type ElementType =
  | "collection"
  | "function"
  | "object"
  | "input"
  | "output";
export type Mode = "create" | "connect" | "move" | "edit";
export type Action =
  | "create"
  | "duplicate"
  | "move"
  | "connect"
  | "select"
  | "delete"
  | "edit"
  | "menu"
  | "none"
  | "save"
  | "load"
  | "clear"
  | "zoomIn"
  | "layout"
  | "zoomOut"
  | "resetView"
  | "changeMode";

export interface Point {
  x: number;
  y: number;
}

export interface ElementData {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  text: string;
  width: number;
  height: number;
  parentId: string | undefined;
  childIds: string[];
  connectionIds: string[];
}

export interface ConnectionData {
  id: string;
  from: string;
  to: string;
}
