import { InputState } from "./InputState.ts";
import { AppElement } from "../_models/AppElement.ts";
import { Action, CreationType, Mode } from "../types.ts";

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
    this.canvas.addEventListener("click", this.handleClick);
    this.canvas.addEventListener("mousedown", this.handleMouseDown);
    this.canvas.addEventListener("mousemove", this.handleMouseMove);
    this.canvas.addEventListener("mouseup", this.handleMouseUp);
    this.canvas.addEventListener("dblclick", this.handleDoubleClick);
    this.canvas.addEventListener("contextmenu", this.handleContextMenu);

    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
    window.addEventListener("input", this.handleInput);

    this.setupButtons();
    this.setupPopupButtons();
  }

  private setupPopupButtons() {
    const closeBtn = document.querySelector("#popup .closeBtn");
    if (!closeBtn) throw new Error("Popup button absent");
    closeBtn?.addEventListener("click", () =>
      this.inputState.interpretActionOnElement("select", undefined)
    );
  }

  private setupActiveButtonGroup(
    selector: string,
    callback: (value: string) => void
  ) {
    document.querySelectorAll(selector).forEach((btn) => {
      btn.addEventListener("click", () => {
        const isToggle = btn.classList.contains("toggle");

        if (isToggle) {
          btn.classList.toggle("active");
        } else {
          document.querySelectorAll(selector).forEach((b) => {
            if (!b.classList.contains("toggle")) {
              b.classList.remove("active");
            }
          });

          btn.classList.add("active");
        }

        const key = selector.replace("[data-", "").replace("]", "");
        const value = (btn as HTMLElement).dataset[key];
        if (value) {
          callback(value);
        }
      });
    });
  }

  private setupButtons() {
    this.setupActiveButtonGroup("[data-create]", (createType) => {
      this.inputState.interpretTypeChange(createType as CreationType);
    });
    this.setupActiveButtonGroup("[data-mode]", (mode) => {
      this.inputState.interpretModeChange(mode as Mode);
    });
    this.setupActiveButtonGroup("[data-project]", (action) => {
      this.inputState.interpretAction(action as Action);
    });
    this.setupActiveButtonGroup("[data-appearance]", (action) => {
      this.inputState.interpretAction(action as Action);
    });

    this.setupActiveButtonGroup("[data-option]", (action) => {
      this.inputState.interpretAction(action as Action);
    });
  }

  private getCanvasCoordinates(e: MouseEvent): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    const zoom = this.inputState.zoom;
    const pan = this.inputState.pan;

    const x = (e.clientX - rect.left) / zoom - pan.x;
    const y = (e.clientY - rect.top) / zoom - pan.y;

    return { x, y };
  }

  private handleCanvasEvent = (
    e: MouseEvent,
    handler: (x: number, y: number, element?: AppElement) => void
  ) => {
    const { x, y } = this.getCanvasCoordinates(e);
    const elements = this.getElementsCallback();
    const clickedElement = this.findElementAt(elements, x, y);
    handler(x, y, clickedElement);
  };

  private handleClick = (e: MouseEvent) => {
    this.handleCanvasEvent(e, (x, y, element) => {
      this.inputState.interpretClick(x, y, element?.id);
    });
  };

  private handleMouseDown = (e: MouseEvent) => {
    this.handleCanvasEvent(e, (x, y, element) => {
      this.inputState.interpretMouseDown(x, y, element);
    });
  };

  private handleMouseUp = () => {
    this.inputState.interpretMouseUp();
  };

  private handleMouseMove = (e: MouseEvent) => {
    const { x, y } = this.getCanvasCoordinates(e);

    if (this.inputState.secondaryId && this.inputState.currentMode === "move") {
      const elements = this.getElementsCallback();
      const draggedElement = elements.find(
        (el) => el.id === this.inputState.secondaryId
      );

      if (draggedElement && this.inputState.dragOffset) {
        this.inputState.interpretDrag(this.inputState.secondaryId, x, y);
      }

      e.preventDefault();
    }
  };

  private handleDoubleClick = (e: MouseEvent) => {
    this.handleCanvasEvent(e, (x, y, element) => {
      if (element) {
        this.inputState.interpretDoubleClick(x, y, element.id);
      }
    });
  };

  private handleContextMenu = (e: MouseEvent) => {
    e.preventDefault();
    this.handleCanvasEvent(e, (x, y, element) => {
      this.inputState.interpretContextMenu(x, y, element?.id);
    });
  };

  private handleInput = (e: Event) => {
    const target = e.target as HTMLInputElement;
    if (!target || target.tagName !== "INPUT") return;

    const activeId = this.inputState.activeId;
    if (!activeId) return;

    const elementParent = target.closest(".element") as HTMLElement | null;
    if (elementParent?.dataset.id === activeId && this.inputState.isEditing) {
      this.inputState.interpretTextEdit(activeId, target.value);
      return;
    }

    const panelInputs = this.getPanelInputsCallback();
    if (panelInputs.includes(target) && activeId) {
      this.inputState.interpretTextEdit(activeId, target.value);
    }
  };

  private setupKeyboardShortcuts() {
    const shortcuts = {
      KeyQ: () => this.inputState.interpretModeChange("create"),
      KeyW: () => this.inputState.interpretModeChange("move"),
      KeyE: () => this.inputState.interpretModeChange("edit"),
      F2: () =>
        this.inputState.activeId &&
        this.inputState.interpretTextEdit(this.inputState.activeId),
      KeyA: () =>
        this.inputState.activeId &&
        this.inputState.interpretActionOnElement(
          "anchor",
          this.inputState.activeId
        ),
      Delete: () =>
        this.inputState.activeId &&
        !this.inputState.isEditing &&
        this.inputState.interpretActionOnElement(
          "delete",
          this.inputState.activeId
        ),
      Backspace: () =>
        this.inputState.activeId &&
        !this.inputState.isEditing &&
        this.inputState.interpretActionOnElement(
          "delete",
          this.inputState.activeId
        ),
    };

    const ctrlShortcuts = {
      KeyS: () => this.inputState.setAction("export"),
      KeyO: () => this.inputState.setAction("import"),
      Equal: () => this.inputState.interpretAction("zoomIn"),
      NumpadAdd: () => this.inputState.interpretAction("zoomIn"),
      Minus: () => this.inputState.interpretAction("zoomOut"),
      NumpadSubtract: () => this.inputState.interpretAction("zoomOut"),
      Digit0: () => this.inputState.interpretAction("zoomReset"),
      Numpad0: () => this.inputState.interpretAction("zoomReset"),
    };

    return { shortcuts, ctrlShortcuts };
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    if (e.code === "Escape") {
      this.inputState.interpretActionOnElement("select", undefined);
      return;
    } else if (e.key === "Shift") {
      this.inputState.shiftKey = true;
      return;
    }

    const { shortcuts, ctrlShortcuts } = this.setupKeyboardShortcuts();

    if (e.ctrlKey || e.metaKey) {
      const handler = ctrlShortcuts[e.code as keyof typeof ctrlShortcuts];
      if (handler) {
        e.preventDefault();
        handler();
        return;
      }
    }

    if (this.inputState.activeId) {
      const handler = shortcuts[e.code as keyof typeof shortcuts];
      if (handler) {
        handler();
        return;
      }

      if (this.inputState.isEditing && e.key === "Enter") {
        this.inputState.setAction("select");
        e.preventDefault();
      }
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    if (e.key === "Shift") {
      this.inputState.shiftKey = false;
      return;
    }
  };

  private findElementAt(
    elements: AppElement[],
    x: number,
    y: number
  ): AppElement | undefined {
    for (let i = elements.length - 1; i >= 0; i--) {
      const el = elements[i];
      const left = el.x - el.width / 2;
      const right = el.x + el.width / 2;
      const top = el.y - el.height / 2;
      const bottom = el.y + el.height / 2;

      if (x >= left && x <= right && y >= top && y <= bottom) {
        return el;
      }
    }
    return undefined;
  }
}
