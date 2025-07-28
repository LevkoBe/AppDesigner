export const elementTypeList = [
  "collection",
  "function",
  "object",
  "input",
  "output",
] as const;
export type ElementType = (typeof elementTypeList)[number];
export type ElementState =
  | "selected"
  | "child"
  | "parent"
  | "anchored"
  | "secondary";

export type Mode =
  | "create"
  | "remove"
  | "connect"
  | "disconnect"
  | "move"
  | "edit";
type ProjectAction = "import" | "export" | "clear";
type AppearanceAction = "layout" | "zoomIn" | "zoomOut" | "zoomReset";
type HelperAction = "menu" | "details";
type ElementAction =
  | "create"
  | "duplicate"
  | "connect"
  | "disconnect"
  | "select"
  | "delete"
  | "anchor"
  | "move"
  | "edit";
export type Action =
  | ProjectAction
  | AppearanceAction
  | HelperAction
  | ElementAction
  | "none"
  | "mode";

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

export type CSSColorVar = `var(--${string})`;
