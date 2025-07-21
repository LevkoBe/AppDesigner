import { AppState } from "../state/AppState.ts";
import { DOMManager } from "../ui/DOMManager.ts";
import { Mode, ElementType } from "../types.ts";
import { ElementUtilities } from "./ElementUtilities.ts";

import { handleElementTypeChange, handleModeChange } from "./ModeHandlers.ts";
import { ClickHandler } from "./CanvasClickHandler.ts";

export class EventHandlers {
  private utils: ElementUtilities;
  private clickHandler: ClickHandler;

  constructor(private state: AppState, private dom: DOMManager) {
    this.utils = new ElementUtilities(state, dom);
    this.clickHandler = new ClickHandler(this.dom, this.state, this.utils);
  }

  handleCanvasClick = (e: MouseEvent) => this.clickHandler.handleCanvasClick(e);

  handleMouseDown = (e: MouseEvent) => this.clickHandler.handleMouseDown(e);

  handleMouseMove = (e: MouseEvent) => this.clickHandler.handleMouseMove(e);

  handleMouseUp = () => this.clickHandler.handleMouseUp();

  handleModeChange = (mode: Mode) =>
    handleModeChange(mode, this.state, this.dom, this.utils);

  handleElementTypeChange = (type: ElementType) =>
    handleElementTypeChange(type, this.state, this.utils);
}
