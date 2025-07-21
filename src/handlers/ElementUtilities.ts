import { AppState } from "../state/AppState.ts";
import { DOMManager } from "../ui/DOMManager.ts";
import { ElementType, Mode } from "../types.ts";

export class ElementUtilities {
  constructor(private state: AppState, private dom: DOMManager) {}

  updateStatus(): void {
    const modeText: Record<Mode, string> = {
      create: "Create/Child Mode",
      connect: "Connection Mode",
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

    let statusText = `${modeText[this.state.currentMode]}`;
    if (this.state.currentMode === "create")
      statusText += ` - ${elementText[this.state.currentElementType]}`;

    if (this.state.currentMode === "connect" && this.state.fromElement) {
      statusText += " - Select target element";
    }

    this.dom.updateStatus(statusText);
  }
}
