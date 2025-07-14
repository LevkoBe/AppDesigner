import { AppState } from "../state/AppState.ts";
import { DOMManager } from "../ui/DOMManager.ts";
import { ElementType, Mode } from "../types.ts";

export class StatusManager {
  private appState: AppState;
  private domManager: DOMManager;

  constructor(appState: AppState, domManager: DOMManager) {
    this.appState = appState;
    this.domManager = domManager;
  }

  public updateStatus(): void {
    const modeText: Record<Mode, string> = {
      create: "Create/Child Mode",
      connection: "Connection Mode",
      move: "Movement Mode",
      edit: "Edit Mode",
    };

    const elementText: Record<ElementType, string> = {
      collection: "Collections",
      function: "Functions",
      object: "Objects",
      input: "Inputs",
      output: "Outputs",
    };

    let statusText = `${modeText[this.appState.currentMode]} ::: ${
      elementText[this.appState.currentElementType]
    }`;

    if (
      this.appState.currentMode === "connection" &&
      this.appState.connectionStart
    ) {
      statusText += " - Select target element";
    }

    this.domManager.updateStatus(statusText);
  }
}
