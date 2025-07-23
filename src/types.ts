export const elementTypeList = [
  "collection",
  "function",
  "object",
  "input",
  "output",
] as const;
export type ElementType = (typeof elementTypeList)[number];

export type Mode = "create" | "connect" | "move" | "edit";
export type Action =
  | "create"
  | "duplicate"
  | "connect"
  | "select"
  | "delete"
  | "anchor"
  | "move"
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
  isAnchored: boolean;
}

export interface ConnectionData {
  id: string;
  from: string;
  to: string;
}
