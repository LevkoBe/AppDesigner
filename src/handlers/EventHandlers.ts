import { AppState } from "../state/AppState.ts";
import { DOMManager } from "../ui/DOMManager.ts";
import { PropertiesPanel } from "../ui/PropertiesPanel.ts";
import { Mode, ElementType } from "../types.ts";
import { ElementUtilities } from "./ElementUtilities.ts";

import { handleCanvasClick } from "./CanvasClickHandler.ts";
import { MouseHandlers } from "./MouseHandlers.ts";
import { handleContextMenu } from "./ContextMenuHandler.ts";
import { handleElementTypeChange, handleModeChange } from "./ModeHandlers.ts";

export class EventHandlers {
  private utils: ElementUtilities;
  private mouseHandler: MouseHandlers;

  constructor(
    private state: AppState,
    private dom: DOMManager,
    private panel: PropertiesPanel
  ) {
    this.utils = new ElementUtilities(state, dom, panel);
    this.mouseHandler = new MouseHandlers(this.state, this.panel, this.dom);
  }

  public handleCanvasClick = (e: MouseEvent) =>
    handleCanvasClick(e, this.state, this.dom, this.panel, this.utils);

  public handleMouseDown = (e: MouseEvent) =>
    this.mouseHandler.handleMouseDown(e);

  public handleMouseMove = (e: MouseEvent) =>
    this.mouseHandler.handleMouseMove(e);

  public handleMouseUp = () => this.mouseHandler.handleMouseUp();

  public handleContextMenu = (e: MouseEvent) =>
    handleContextMenu(e, this.state, this.dom);

  public handleModeChange = (mode: Mode) =>
    handleModeChange(mode, this.state, this.dom, this.utils);

  public handleElementTypeChange = (type: ElementType) =>
    handleElementTypeChange(type, this.state, this.utils);
}
