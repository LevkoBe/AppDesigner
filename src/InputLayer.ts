import { InputState } from "./InputState.js";
import { Action, ElementType, Mode } from "./types.js";
import { AppElement } from "./models/Element.js";

export class InputLayer {
  constructor(
    private canvas: HTMLCanvasElement,
    private inputState: InputState,
    private getElementsCallback: () => AppElement[]
  ) {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.canvas.addEventListener("click", this.handleClick);
    this.canvas.addEventListener("mousedown", this.handleMouseDown);
    this.canvas.addEventListener("mousemove", this.handleMouseMove);
    this.canvas.addEventListener("mouseup", this.handleMouseUp);
    this.canvas.addEventListener("dblclick", this.handleDoubleClick);
    this.setupModeButtons();
    this.setupElementTypeButtons();
    this.setupContextMenuEvents();
    window.addEventListener("keydown", this.handleKeyDown);
  }

  private setupModeButtons(): void {
    document.querySelectorAll(".mode-btn, [data-mode]").forEach((btn) => {
      btn.addEventListener("click", () => {
        document
          .querySelectorAll(".mode-btn, [data-mode]")
          .forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");

        const mode = (btn as HTMLElement).dataset.mode as Mode;
        if (mode) this.inputState.currentMode = mode;
      });
    });
  }

  private setupElementTypeButtons(): void {
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

  private setupContextMenuEvents(): void {
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

  private handleClick = (e: MouseEvent): void => {
    const elements = this.getElementsCallback();
    const { x, y } = this.getCanvasCoordinates(e);
    const clickedElement = this.findElementAt(elements, x, y);

    this.inputState.interpretClick(x, y, clickedElement?.id, e.shiftKey);
  };

  private handleMouseDown = (e: MouseEvent): void => {
    const { x, y } = this.getCanvasCoordinates(e);
    const elements = this.getElementsCallback();
    const clickedElement = this.findElementAt(elements, x, y);

    this.inputState.interpretMouseDown(x, y, clickedElement?.id);

    if (clickedElement && this.inputState.currentMode === "move") {
      this.inputState.dragOffset = {
        x: x - clickedElement.x,
        y: y - clickedElement.y,
      };
      e.preventDefault();
    }
  };

  private handleMouseMove = (e: MouseEvent): void => {
    const { x, y } = this.getCanvasCoordinates(e);

    if (
      this.inputState.isDragging &&
      this.inputState.activeId &&
      this.inputState.currentMode === "move"
    ) {
      const elements = this.getElementsCallback();
      const draggedElement = elements.find(
        (el) => el.id === this.inputState.activeId
      );

      if (draggedElement && this.inputState.dragOffset) {
        const newX = x - this.inputState.dragOffset.x;
        const newY = y - this.inputState.dragOffset.y;

        this.inputState.interpretDrag(this.inputState.activeId, newX, newY);
      }

      e.preventDefault();
    }
  };

  private handleMouseUp = (): void => {
    this.inputState.interpretMouseUp();
  };

  private handleDoubleClick = (e: MouseEvent): void => {
    const { x, y } = this.getCanvasCoordinates(e);
    const elements = this.getElementsCallback();
    const clickedElement = this.findElementAt(elements, x, y);

    if (clickedElement) {
      this.inputState.interpretDoubleClick(x, y, clickedElement.id);
    }
  };

  private handleContextMenu = (e: MouseEvent): void => {
    e.preventDefault();

    const { x, y } = this.getCanvasCoordinates(e);
    const clickedElement = this.findElementAt(this.getElementsCallback(), x, y);

    this.inputState.interpretContextMenu(x, y, clickedElement?.id);
  };

  private handleContextMenuOption = (e: MouseEvent, option: Action): void => {
    e.preventDefault();
    this.inputState.interpretContextMenuOption(option);
  };

  private handleKeyDown = (e: KeyboardEvent): void => {
    const activeId = this.inputState.activeId;
    if (!activeId) return;

    if (e.key === "F2") {
      this.inputState.interpretTextEdit(activeId);
      return;
    }

    if (!this.inputState.isEditing || !this.inputState.activeId) return;

    const activeInput = document.querySelector(
      `.element[data-id="${this.inputState.activeId}"] .element-input`
    ) as HTMLInputElement | null;

    if (!activeInput) return;

    setTimeout(() => {
      if (e.key === "Escape" || e.key === "Enter") {
        this.inputState.stopEditing();
        e.preventDefault();
      } else this.inputState.interpretTextEdit(activeId, activeInput.value);
    }, 10);
  };

  public resetConnectionState(): void {
    this.inputState.resetConnectionState();
  }

  public handleDeleteConfirmed(elementId: string): void {
    this.inputState.interpretDelete(elementId);
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
