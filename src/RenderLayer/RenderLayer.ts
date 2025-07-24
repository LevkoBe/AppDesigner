import { Mode } from "fs";
import { Connection } from "../_models/Connection.js";
import { AppElement } from "../_models/AppElement.js";
import { AppState } from "../LogicLayer/AppState.js";
import { PropertiesPanel } from "./PropertiesPanel.js";
import { ElementType } from "../types.js";
import { ElementFactory } from "./ElementFactory.js";

export class RenderLayer {
  private elementMap = new Map<string, HTMLElement>();
  private connectionMap = new Map<string, SVGElement>();
  private propertiesPanel: PropertiesPanel;
  private elementFactory: ElementFactory;

  constructor(private canvas: HTMLElement, private state: AppState) {
    this.propertiesPanel = new PropertiesPanel(state);
    this.elementFactory = new ElementFactory();
  }

  render() {
    this.updateStatus();
    this.updateElementTypeSelection();
    this.setCanvasTransform(this.state.zoom);
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
        domElement = this.elementFactory.createDOMElement(element, this.canvas);
        this.elementMap.set(element.id, domElement);
      }

      this.elementFactory.updateElement(
        domElement,
        element,
        this.state.pan,
        element.id === selectedId,
        this.state.fromElement?.id === element.id,
        this.state.editingElement?.id === element.id
      );
    });

    const pos = this.state.targetPosition;
    if (this.state.contextMenu && pos) this.showContextMenu(pos.x, pos.y);
    else this.hideContextMenu();
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
        svgElement = this.createConnectionDOM();
        this.connectionMap.set(connection.id, svgElement);
      }
      this.updateConnectionDOM(svgElement, fromElement, toElement);
    });
  }

  private createConnectionDOM(): SVGElement {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.classList.add("connection-svg");

    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.classList.add("connection-line");

    svg.appendChild(line);
    this.canvas.appendChild(svg);

    return svg;
  }

  private updateConnectionDOM(
    svg: SVGElement,
    fromElement: AppElement,
    toElement: AppElement
  ) {
    const line = svg.querySelector("line") as SVGLineElement;
    if (!line) return;

    const fromX = fromElement.x;
    const fromY = fromElement.y;
    const toX = toElement.x;
    const toY = toElement.y;

    const padding = 20;
    const minX = Math.min(fromX, toX) - padding;
    const minY = Math.min(fromY, toY) - padding;
    const maxX = Math.max(fromX, toX) + padding;
    const maxY = Math.max(fromY, toY) + padding;

    svg.style.left = minX + "px";
    svg.style.top = minY + "px";
    svg.style.width = maxX - minX + "px";
    svg.style.height = maxY - minY + "px";

    const lineX1 = fromX - minX;
    const lineY1 = fromY - minY;
    const lineX2 = toX - minX;
    const lineY2 = toY - minY;

    line.setAttribute("x1", lineX1.toString());
    line.setAttribute("y1", lineY1.toString());
    line.setAttribute("x2", lineX2.toString());
    line.setAttribute("y2", lineY2.toString());
  }

  showContextMenu(x: number, y: number) {
    const contextMenu = document.getElementById("contextMenu");
    const canvasRect = this.canvas.getBoundingClientRect();

    if (contextMenu) {
      let finalX = canvasRect.left + x;
      let finalY = canvasRect.top + y;

      if (finalX + contextMenu.offsetWidth > window.innerWidth - 20) {
        finalX = window.innerWidth - contextMenu.offsetWidth - 20;
      }
      if (finalY + contextMenu.offsetHeight > window.innerHeight - 20) {
        finalY = window.innerHeight - contextMenu.offsetHeight - 20;
      }

      contextMenu.style.left = finalX + "px";
      contextMenu.style.top = finalY + "px";
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

  updateStatus() {
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

  setCanvasTransform(zoom: number) {
    const inverseZoom = 1 / zoom;

    this.canvas.style.width = `${100 * inverseZoom}%`;
    this.canvas.style.height = `${100 * inverseZoom}%`;

    this.canvas.style.transform = `scale(${zoom})`;
    this.canvas.style.transformOrigin = `0 0`;
  }
}
