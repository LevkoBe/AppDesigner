import { InputState } from "./InputState.ts";
import { ElementType, Action, Mode } from "../types.ts";
import { AppElement } from "../_models/AppElement.ts";

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
    this.setupModeButtons();
    this.setupElementTypeButtons();
    this.setupContextMenuEvents();
    this.setupProjectEvents();
    this.setupControlsEvents();
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("input", this.handleInput);
  }

  private setupControlsEvents() {
    const toggleLayout = document.getElementById("layoutBtn")!;
    const zoomInBtn = document.getElementById("zoomInBtn")!;
    const zoomOutBtn = document.getElementById("zoomOutBtn")!;
    const resetViewBtn = document.getElementById("resetViewBtn")!;

    toggleLayout.addEventListener("click", (e) => {
      this.handleControlsAction(e, "layout");
      toggleLayout.classList.toggle("active");
    });
    zoomInBtn.addEventListener("click", (e) =>
      this.handleControlsAction(e, "zoomIn")
    );
    zoomOutBtn.addEventListener("click", (e) =>
      this.handleControlsAction(e, "zoomOut")
    );
    resetViewBtn.addEventListener("click", (e) =>
      this.handleControlsAction(e, "resetView")
    );
  }

  private setupProjectEvents() {
    const saveBtn = document.getElementById("saveBtn");
    const loadBtn = document.getElementById("loadBtn");
    const clearBtn = document.getElementById("clearBtn");

    if (saveBtn)
      saveBtn.addEventListener("click", (e) =>
        this.handleDirectAction(e, "save")
      );
    if (loadBtn)
      loadBtn.addEventListener("click", (e) =>
        this.handleDirectAction(e, "load")
      );
    if (clearBtn)
      clearBtn.addEventListener("click", (e) =>
        this.handleDirectAction(e, "clear")
      );
  }

  private setupModeButtons() {
    document.querySelectorAll(".mode-btn, [data-mode]").forEach((btn) => {
      btn.addEventListener("click", () => {
        document
          .querySelectorAll(".mode-btn, [data-mode]")
          .forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");

        const mode = (btn as HTMLElement).dataset.mode as Mode;
        if (mode) this.inputState.interpretModeChange(mode);
      });
    });
  }

  private setupElementTypeButtons() {
    document.querySelectorAll(".element-btn, [data-type]").forEach((btn) => {
      btn.addEventListener("click", () => {
        document
          .querySelectorAll(".element-btn, [data-type]")
          .forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");

        const type = (btn as HTMLElement).dataset.type as ElementType;
        if (type) this.inputState.elementType = type;
      });
    });
  }

  private setupContextMenuEvents() {
    document
      .getElementById("editBtn")
      ?.addEventListener("click", (e) =>
        this.handleContextMenuOption(e, "edit")
      );
    document
      .getElementById("duplicateBtn")
      ?.addEventListener("click", (e) =>
        this.handleContextMenuOption(e, "duplicate")
      );
    document
      .getElementById("deleteBtn")
      ?.addEventListener("click", (e) =>
        this.handleContextMenuOption(e, "delete")
      );

    this.canvas.addEventListener("contextmenu", this.handleContextMenu);
  }

  private getCanvasCoordinates(e: MouseEvent): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    const zoom = this.inputState.zoom;
    const pan = this.inputState.pan;

    const x = (e.clientX - rect.left) / zoom - pan.x;
    const y = (e.clientY - rect.top) / zoom - pan.y;

    return { x, y };
  }

  private handleClick = (e: MouseEvent) => {
    const elements = this.getElementsCallback();
    const { x, y } = this.getCanvasCoordinates(e);
    const clickedElement = this.findElementAt(elements, x, y);

    this.inputState.interpretClick(x, y, clickedElement?.id, e.shiftKey);
  };

  private handleMouseDown = (e: MouseEvent) => {
    const { x, y } = this.getCanvasCoordinates(e);
    const clickedElement = this.findElementAt(this.getElementsCallback(), x, y);

    this.inputState.interpretMouseDown(x, y, clickedElement);
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
    const { x, y } = this.getCanvasCoordinates(e);
    const elements = this.getElementsCallback();
    const clickedElement = this.findElementAt(elements, x, y);

    if (clickedElement) {
      this.inputState.interpretDoubleClick(x, y, clickedElement.id);
    }
  };

  private handleContextMenu = (e: MouseEvent) => {
    e.preventDefault();

    const { x, y } = this.getCanvasCoordinates(e);
    const clickedElement = this.findElementAt(this.getElementsCallback(), x, y);

    this.inputState.interpretContextMenu(x, y, clickedElement?.id);
  };

  private handleContextMenuOption = (e: MouseEvent, option: Action) => {
    e.preventDefault();
    this.inputState.interpretContextMenuOption(option);
  };

  private handleControlsAction = (e: MouseEvent, action: Action) => {
    e.preventDefault();
    this.inputState.interpretControlsAction(action);
  };

  private handleDirectAction = (e: MouseEvent, action: Action) => {
    e.preventDefault();
    this.inputState.setAction(action);
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

  private handleKeyDown = (e: KeyboardEvent) => {
    const activeId = this.inputState.activeId;
    if (activeId) {
      switch (e.code) {
        case "F2":
          this.inputState.interpretTextEdit(activeId);
          return;
        case "Escape":
          this.inputState.interpretActionOnElement("select", undefined);
          break;
        case "KeyA":
          this.inputState.interpretActionOnElement("anchor", activeId);
          break;
      }
    }

    if (this.inputState.isEditing && activeId) {
      if (e.key === "Escape" || e.key === "Enter") {
        this.inputState.setAction("select");
        e.preventDefault();
      }
    }
  };

  resetConnectionState() {
    this.inputState.resetConnectionState();
  }

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
