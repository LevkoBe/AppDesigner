import { InputState } from "./InputState.ts";
import { AppElement } from "../_models/AppElement.ts";
import { Action, ElementType, Mode } from "../types.ts";

export class InputLayer {
  constructor(
    private canvas: HTMLCanvasElement,
    private inputState: InputState,
    private getElementsCallback: () => AppElement[],
    private getPanelInputsCallback: () => HTMLInputElement[]
  ) {
    this.setupEventListeners();
  }

  private setupEventListeners() {
    // Canvas events
    this.canvas.addEventListener("click", this.handleClick);
    this.canvas.addEventListener("mousedown", this.handleMouseDown);
    this.canvas.addEventListener("mousemove", this.handleMouseMove);
    this.canvas.addEventListener("mouseup", this.handleMouseUp);
    this.canvas.addEventListener("dblclick", this.handleDoubleClick);
    this.canvas.addEventListener("contextmenu", this.handleContextMenu);

    // Global events
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
    window.addEventListener("input", this.handleInput);

    this.setupButtons();
    this.setupPopupButtons();
  }

  private setupPopupButtons() {
    const closeBtn = document.querySelector("#popup .closeBtn");
    if (!closeBtn) throw new Error("Popup button absent");
    closeBtn.addEventListener("click", () =>
      this.inputState.executeAction("select")
    );
  }

  private setupButtonGroup(
    selector: string,
    callback: (value: string) => void
  ) {
    document.querySelectorAll(selector).forEach((btn) => {
      btn.addEventListener("click", () => {
        const key = selector.replace("[data-", "").replace("]", "");
        const value = (btn as HTMLElement).dataset[key];
        if (value) callback(value);
      });
    });
  }

  private setupButtons() {
    this.setupButtonGroup("[data-create]", (type) =>
      this.inputState.setElementType(type as ElementType)
    );
    this.setupButtonGroup("[data-mode]", (mode) =>
      this.inputState.setMode(mode as Mode)
    );
    this.setupButtonGroup("[data-project]", (action) =>
      this.inputState.executeAction(action as Action)
    );
    this.setupButtonGroup("[data-appearance]", (action) =>
      this.inputState.executeAction(action as Action)
    );
    this.setupButtonGroup("[data-option]", (action) =>
      this.inputState.executeAction(action as Action)
    );
  }

  private getCanvasCoordinates(e: MouseEvent) {
    const rect = this.canvas.getBoundingClientRect();
    const { zoom, pan } = this.inputState;
    return {
      x: (e.clientX - rect.left) / zoom - pan.x,
      y: (e.clientY - rect.top) / zoom - pan.y,
    };
  }

  private withCanvasCoordinates = (
    e: MouseEvent,
    handler: (x: number, y: number, element?: AppElement) => void
  ) => {
    const { x, y } = this.getCanvasCoordinates(e);
    const element = this.findElementAt(x, y);
    handler(x, y, element);
  };

  private handleClick = (e: MouseEvent) => {
    this.withCanvasCoordinates(e, (x, y, element) => {
      this.inputState.onClick(x, y, element?.id);
    });
  };

  private handleMouseDown = (e: MouseEvent) => {
    this.withCanvasCoordinates(e, (x, y, element) => {
      this.inputState.onMouseDown(x, y, element);
    });
  };

  private handleMouseUp = () => {
    this.inputState.onMouseUp();
  };

  private handleMouseMove = (e: MouseEvent) => {
    if (this.inputState.currentMode !== "move" || !this.inputState.activeId)
      return;

    const { x, y } = this.getCanvasCoordinates(e);
    this.inputState.onDrag(this.inputState.activeId, x, y);
    e.preventDefault();
  };

  private handleDoubleClick = (e: MouseEvent) => {
    this.withCanvasCoordinates(e, (x, y, element) => {
      if (element) this.inputState.onDoubleClick(x, y, element.id);
    });
  };

  private handleContextMenu = (e: MouseEvent) => {
    e.preventDefault();
    this.withCanvasCoordinates(e, (x, y, element) => {
      this.inputState.onContextMenu(x, y, element?.id);
    });
  };

  private handleInput = (e: Event) => {
    const target = e.target as HTMLInputElement;
    if (!target || target.tagName !== "INPUT" || !this.inputState.activeId)
      return;

    const elementParent = target.closest(".element") as HTMLElement;
    const isElementInput =
      elementParent?.dataset.id === this.inputState.activeId;
    const isPanelInput = this.getPanelInputsCallback().includes(target);

    if (isElementInput || isPanelInput) {
      this.inputState.executeAction("edit", target.value);
    }
  };

  private getKeyboardShortcuts() {
    return {
      normal: {
        KeyQ: () => this.inputState.setMode("create"),
        KeyW: () => this.inputState.setMode("move"),
        KeyE: () => this.inputState.setMode("edit"),
        F2: () =>
          this.inputState.activeId && this.inputState.executeAction("edit"),
        KeyA: () =>
          this.inputState.activeId && this.inputState.executeAction("anchor"),
        Delete: () => this.handleDeleteKey(),
        Backspace: () => this.handleDeleteKey(),
      },
      withCtrl: {
        KeyS: () => this.inputState.executeAction("export"),
        KeyO: () => this.inputState.executeAction("import"),
        Equal: () => this.inputState.executeAction("zoomIn"),
        NumpadAdd: () => this.inputState.executeAction("zoomIn"),
        Minus: () => this.inputState.executeAction("zoomOut"),
        NumpadSubtract: () => this.inputState.executeAction("zoomOut"),
        Digit0: () => this.inputState.executeAction("zoomReset"),
        Numpad0: () => this.inputState.executeAction("zoomReset"),
      },
    };
  }

  private handleDeleteKey() {
    if (this.inputState.activeId && !this.inputState.isEditing) {
      this.inputState.executeAction("delete");
    }
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    if (e.code === "Escape") {
      this.inputState.clear();
      return;
    }

    if (e.key === "Shift") {
      this.inputState.shiftKey = true;
      return;
    }

    const shortcuts = this.getKeyboardShortcuts();

    if (e.ctrlKey || e.metaKey) {
      const handler =
        shortcuts.withCtrl[e.code as keyof typeof shortcuts.withCtrl];
      if (handler) {
        e.preventDefault();
        handler();
        return;
      }
    }

    const handler = shortcuts.normal[e.code as keyof typeof shortcuts.normal];
    if (handler) {
      handler();
      return;
    }

    if (this.inputState.isEditing && e.key === "Enter") {
      this.inputState.executeAction("select");
      e.preventDefault();
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    if (e.key === "Shift") {
      this.inputState.shiftKey = false;
    }
  };

  private findElementAt(x: number, y: number): AppElement | undefined {
    const elements = this.getElementsCallback();

    for (let i = elements.length - 1; i >= 0; i--) {
      const el = elements[i];
      const bounds = {
        left: el.x - el.width / 2,
        right: el.x + el.width / 2,
        top: el.y - el.height / 2,
        bottom: el.y + el.height / 2,
      };

      if (
        x >= bounds.left &&
        x <= bounds.right &&
        y >= bounds.top &&
        y <= bounds.bottom
      ) {
        return el;
      }
    }
    return undefined;
  }
}
