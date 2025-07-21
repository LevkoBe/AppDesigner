import { AppState } from "../state/AppState.ts";
import { DOMManager } from "./DOMManager.ts";

export class ViewControls {
  private appState: AppState;
  private domManager: DOMManager;

  constructor(appState: AppState, domManager: DOMManager) {
    this.appState = appState;
    this.domManager = domManager;
  }

  zoomIn = (): void => {
    this.appState.zoom *= 1.2;
    this.domManager.setCanvasTransform(
      this.appState.zoom,
      this.appState.pan.x,
      this.appState.pan.y
    );
  };

  zoomOut = (): void => {
    this.appState.zoom /= 1.2;
    this.domManager.setCanvasTransform(
      this.appState.zoom,
      this.appState.pan.x,
      this.appState.pan.y
    );
  };

  resetView = (): void => {
    this.appState.zoom = 1;
    this.appState.pan = { x: 0, y: 0 };
    this.domManager.setCanvasTransform(1, 0, 0);
  };
}
