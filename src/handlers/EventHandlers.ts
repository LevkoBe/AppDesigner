import { AppState } from "../state/AppState.ts";
import { DOMManager } from "../ui/DOMManager.ts";
import { PropertiesPanel } from "../ui/PropertiesPanel.ts";
import { Mode, ElementType } from "../types.ts";
import { ElementUtilities } from "./ElementUtilities.ts";

import { handleElementTypeChange, handleModeChange } from "./ModeHandlers.ts";
import { ClickHandler } from "./CanvasClickHandler.ts";

export class EventHandlers {
  private utils: ElementUtilities;
  private clickHandler: ClickHandler;

  constructor(
    private state: AppState,
    private dom: DOMManager,
    private panel: PropertiesPanel
  ) {
    this.utils = new ElementUtilities(state, dom);
    this.clickHandler = new ClickHandler(
      this.dom,
      this.panel,
      this.state,
      this.utils
    );
  }

  public handleCanvasClick = (e: MouseEvent) =>
    this.clickHandler.handleCanvasClick(e);

  public handleMouseDown = (e: MouseEvent) =>
    this.clickHandler.handleMouseDown(e);

  public handleMouseMove = (e: MouseEvent) =>
    this.clickHandler.handleMouseMove(e);

  public handleMouseUp = () => this.clickHandler.handleMouseUp();

  public handleModeChange = (mode: Mode) =>
    handleModeChange(mode, this.state, this.dom, this.utils);

  public handleElementTypeChange = (type: ElementType) =>
    handleElementTypeChange(type, this.state, this.utils);
}
