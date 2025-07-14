import { AppState } from "../state/AppState.ts";
import { DOMManager } from "../ui/DOMManager.ts";
import { PropertiesPanel } from "../ui/PropertiesPanel.ts";
import { Mode, ElementType } from "../types.ts";
import { ElementUtilities } from "./ElementUtilities.ts";

import { handleCanvasClick } from "./CanvasClickHandler.ts";
import {
  handleMouseDown,
  handleMouseMove,
  handleMouseUp,
} from "./MouseHandlers.ts";
import { handleContextMenu } from "./ContextMenuHandler.ts";
import { handleElementTypeChange, handleModeChange } from "./ModeHandlers.ts";

export class EventHandlers {
  private utils: ElementUtilities;

  constructor(
    private state: AppState,
    private dom: DOMManager,
    private panel: PropertiesPanel
  ) {
    this.utils = new ElementUtilities(state, dom, panel);
  }

  public handleCanvasClick = (e: MouseEvent) =>
    handleCanvasClick(e, this.state, this.dom, this.panel, this.utils);

  public handleMouseDown = (e: MouseEvent) =>
    handleMouseDown(e, this.state, this.dom, this.panel);

  public handleMouseMove = (e: MouseEvent) =>
    handleMouseMove(e, this.state, this.dom, this.panel);

  public handleMouseUp = () => handleMouseUp(this.state);

  public handleContextMenu = (e: MouseEvent) =>
    handleContextMenu(e, this.state, this.dom);

  public handleModeChange = (mode: Mode) =>
    handleModeChange(mode, this.state, this.dom, this.utils);

  public handleElementTypeChange = (type: ElementType) =>
    handleElementTypeChange(type, this.state, this.utils);
}
