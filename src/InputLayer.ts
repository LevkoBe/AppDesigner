import { InputState } from "./InputState.js";
import { Mode } from "fs";
import { ElementType } from "./types.js";
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
    this.canvas.addEventListener("contextmenu", this.handleContextMenu);
    this.setupModeButtons();
    this.setupElementTypeButtons();
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
      this.inputState.selectedElementId &&
      this.inputState.currentMode === "move"
    ) {
      const elements = this.getElementsCallback();
      const draggedElement = elements.find(
        (el) => el.id === this.inputState.selectedElementId
      );

      if (draggedElement && this.inputState.dragOffset) {
        const newX = x - this.inputState.dragOffset.x;
        const newY = y - this.inputState.dragOffset.y;

        this.inputState.interpretDrag(
          this.inputState.selectedElementId,
          newX,
          newY
        );
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
    const elements = this.getElementsCallback();
    const clickedElement = this.findElementAt(elements, x, y);

    this.inputState.interpretContextMenu(x, y, clickedElement?.id);
  };

  public resetConnectionState(): void {
    this.inputState.resetConnectionState();
  }

  public handleTextEditComplete(elementId: string, newText: string): void {
    this.inputState.interpretTextEdit(elementId, newText);
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
      if (
        x >= el.x &&
        x <= el.x + el.width &&
        y >= el.y &&
        y <= el.y + el.height
      ) {
        return el;
      }
    }
    return undefined;
  }
}
