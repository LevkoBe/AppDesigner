import { Mode } from "fs";
import { Connection } from "./models/Connection.js";
import { AppElement } from "./models/Element.js";
import { AppState } from "./state/AppState.js";
import { PropertiesPanel } from "./ui/PropertiesPanel.js";
import { ElementType } from "./types.js";

export class RenderLayer {
  private elementMap = new Map<string, HTMLElement>();
  private connectionMap = new Map<string, SVGElement>();
  private propertiesPanel: PropertiesPanel;

  constructor(private canvas: HTMLElement, private state: AppState) {
    this.propertiesPanel = new PropertiesPanel(state);
  }

  render() {
    this.updateStatus();
    this.updateElementTypeSelection();
    this.setCanvasTransform(
      this.state.zoom,
      this.state.pan.x,
      this.state.pan.y
    );
    this.renderElements(
      this.state.elements,
      this.state.selectedElement?.id ?? undefined
    );
    this.renderConnections(this.state.connections);
    this.propertiesPanel.updatePanel(this.state.selectedElement);
    this.state.rerenderNeeded = false;
  }

  private renderElements(
    elements: AppElement[],
    selectedId: string | undefined
  ) {
    const currentIds = new Set(elements.map((el) => el.id));
    for (const [id, domElement] of this.elementMap) {
      if (!currentIds.has(id)) {
        domElement.remove();
        this.elementMap.delete(id);
      }
    }

    elements.forEach((element) => {
      let domElement = this.elementMap.get(element.id);

      if (!domElement) {
        domElement = this.createElementDOM(element);
        this.elementMap.set(element.id, domElement);
      }

      const isSelected = element.id === selectedId;
      const isEditing = this.state.editingElement?.id === element.id;

      this.updateElementDOM(domElement, element);

      if (isSelected) {
        domElement.classList.add("selected");
      } else {
        domElement.classList.remove("selected");
      }

      this.updateEditingState(domElement, element, isEditing);
    });

    const pos = this.state.targetPosition;
    if (this.state.contextMenu && pos) this.showContextMenu(pos.x, pos.y);
    else this.hideContextMenu();
  }

  private createElementDOM(element: AppElement): HTMLElement {
    const div = document.createElement("div");
    div.className = `element ${element.type}`;
    div.dataset.id = element.id;

    const textSpan = document.createElement("span");
    textSpan.className = "element-text";
    div.appendChild(textSpan);

    const input = document.createElement("input");
    input.className = "element-input";
    input.type = "text";
    input.style.display = "none";
    input.style.background = "transparent";
    input.style.border = "none";
    input.style.outline = "none";
    input.style.color = "inherit";
    input.style.font = "inherit";
    input.style.textAlign = "center";
    input.style.width = "100%";

    div.appendChild(input);

    this.updateElementDOM(div, element);
    this.canvas.appendChild(div);

    return div;
  }

  private updateElementDOM(domElement: HTMLElement, element: AppElement) {
    domElement.style.left = element.x - element.width / 2 + "px";
    domElement.style.top = element.y - element.height / 2 + "px";
    domElement.style.width = element.width + "px";
    domElement.style.height = element.height + "px";

    const textSpan = domElement.querySelector(".element-text") as HTMLElement;
    const input = domElement.querySelector(
      ".element-input"
    ) as HTMLInputElement;
    if (textSpan) {
      textSpan.textContent = element.text;
    }

    if (input) {
      input.value = element.text;
    }
  }

  private updateEditingState(
    domElement: HTMLElement,
    element: AppElement,
    isEditing: boolean
  ) {
    const textSpan = domElement.querySelector(".element-text") as HTMLElement;
    const input = domElement.querySelector(
      ".element-input"
    ) as HTMLInputElement;

    if (textSpan && input) {
      if (isEditing) {
        textSpan.style.display = "none";
        input.style.display = "block";
        input.focus();
        input.value = element.text;
      } else {
        textSpan.style.display = "block";
        input.style.display = "none";
        textSpan.textContent = element.text;
      }
    }
  }

  private renderConnections(connections: Connection[]) {
    const currentIds = new Set(connections.map((conn) => conn.id));
    for (const [id, svgElement] of this.connectionMap) {
      if (!currentIds.has(id)) {
        svgElement.remove();
        this.connectionMap.delete(id);
      }
    }

    connections.forEach((connection) => {
      const fromElement = connection.from;
      const toElement = connection.to;

      if (!fromElement || !toElement) return;

      let svgElement = this.connectionMap.get(connection.id);

      if (!svgElement) {
        svgElement = this.createConnectionDOM(fromElement, toElement);
        this.connectionMap.set(connection.id, svgElement);
      } else {
        this.updateConnectionDOM(svgElement, fromElement, toElement);
      }
    });
  }

  private createConnectionDOM(
    fromElement: AppElement,
    toElement: AppElement
  ): SVGElement {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.classList.add("connection-svg");
    svg.style.position = "absolute";
    svg.style.pointerEvents = "none";
    svg.style.zIndex = "1";

    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.classList.add("connection-line");
    line.setAttribute("stroke", "rgba(255, 255, 255, 0.8)");
    line.setAttribute("stroke-width", "2");

    svg.appendChild(line);
    this.canvas.appendChild(svg);

    this.updateConnectionDOM(svg, fromElement, toElement);
    return svg;
  }

  private updateConnectionDOM(
    svg: SVGElement,
    fromElement: AppElement,
    toElement: AppElement
  ) {
    const line = svg.querySelector("line") as SVGLineElement;
    if (!line) return;

    const minX = Math.min(fromElement.x, toElement.x) - 20;
    const minY = Math.min(fromElement.y, toElement.y) - 20;
    const maxX = Math.max(fromElement.x, toElement.x) + 20;
    const maxY = Math.max(fromElement.y, toElement.y) + 20;

    svg.style.left = minX + "px";
    svg.style.top = minY + "px";
    svg.style.width = maxX - minX + "px";
    svg.style.height = maxY - minY + "px";

    line.setAttribute("x1", (fromElement.x - minX).toString());
    line.setAttribute("y1", (fromElement.y - minY).toString());
    line.setAttribute("x2", (toElement.x - minX).toString());
    line.setAttribute("y2", (toElement.y - minY).toString());
  }

  showContextMenu(x: number, y: number) {
    const contextMenu = document.getElementById("contextMenu");
    const canvasRect = this.canvas.getBoundingClientRect();

    if (contextMenu) {
      contextMenu.style.left = canvasRect.left + x + "px";
      contextMenu.style.top = canvasRect.top + y + "px";
      contextMenu.classList.remove("hidden");
    }
  }

  hideContextMenu() {
    const contextMenu = document.getElementById("contextMenu");
    if (contextMenu) {
      contextMenu.classList.add("hidden");
    }
  }

  getActivePanelInputs(): HTMLInputElement[] {
    return this.propertiesPanel.getInputs();
  }

  updateElementTypeSelection() {
    const selector = document.getElementById("elementTypeSelection")!;
    if (this.state.currentMode === "create")
      selector.classList.remove("hidden");
    else selector.classList.add("hidden");
  }

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

    const status = document.getElementById("status");
    if (status) {
      status.textContent = statusText;
    }
  }

  setCanvasTransform(zoom: number, panX: number, panY: number): void {
    this.canvas.style.transform = `scale(${zoom}) translate(${panX}px, ${panY}px)`;
  }
}
