import { AppElement } from "../models/Element.ts";
import { Connection } from "../models/Connection.ts";

export class DOMManager {
  private canvas: HTMLElement;

  constructor(canvas: HTMLElement) {
    this.canvas = canvas;
  }

  public getCanvasRect(): DOMRect {
    return this.canvas.getBoundingClientRect();
  }

  public createElementDOM(element: AppElement): void {
    const div = document.createElement("div");
    div.className = `element ${element.type}`;
    if (element.parent) {
      div.classList.add("has-parent");
    }

    div.style.left = element.cornerX + "px";
    div.style.top = element.cornerY + "px";
    div.style.width = element.width + "px";
    div.style.height = element.height + "px";
    div.textContent = element.text;
    div.dataset.id = element.id.toString();

    div.addEventListener("dblclick", (e) => {
      e.stopPropagation();
      this.editElementText(element);
    });

    this.canvas.appendChild(div);
    element.domElement = div;
  }

  public updateElementPosition(element: AppElement): void {
    if (element.domElement) {
      element.domElement.style.left = element.cornerX + "px";
      element.domElement.style.top = element.cornerY + "px";
    }
    element.children.forEach((child) => this.updateElementPosition(child));
  }

  public updateElementTextContent(element: AppElement): void {
    if (element.domElement) {
      element.domElement.textContent = element.text;
    }
  }

  public editElementText(element: AppElement): void {
    const newText = prompt("Edit element text:", element.text);
    if (newText !== null) {
      element.text = newText;
      this.updateElementTextContent(element);
    }
  }

  public createConnectionDOM(connection: Connection): void {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.classList.add("connection-svg");
    svg.style.position = "absolute";
    svg.style.pointerEvents = "none";
    svg.style.zIndex = "1";
    svg.style.overflow = "visible";

    const fromX = connection.from.centerX;
    const fromY = connection.from.centerY;
    const toX = connection.to.centerX;
    const toY = connection.to.centerY;

    const minX = Math.min(fromX, toX) - 20;
    const minY = Math.min(fromY, toY) - 20;
    const maxX = Math.max(fromX, toX) + 20;
    const maxY = Math.max(fromY, toY) + 20;

    svg.style.left = minX + "px";
    svg.style.top = minY + "px";
    svg.style.width = maxX - minX + "px";
    svg.style.height = maxY - minY + "px";

    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.classList.add("connection-line");
    line.setAttribute("x1", (fromX - minX).toString());
    line.setAttribute("y1", (fromY - minY).toString());
    line.setAttribute("x2", (toX - minX).toString());
    line.setAttribute("y2", (toY - minY).toString());
    line.setAttribute("stroke", "rgba(255, 255, 255, 0.8)");
    line.setAttribute("stroke-width", "2");

    svg.appendChild(line);
    this.canvas.appendChild(svg);
  }

  public updateConnections(connections: Connection[]): void {
    document.querySelectorAll(".connection-svg").forEach((svg) => svg.remove());

    connections.forEach((connection) => {
      this.createConnectionDOM(connection);
    });
  }

  public showContextMenu(x: number, y: number): void {
    const contextMenu = document.getElementById("contextMenu");
    if (contextMenu) {
      contextMenu.style.left = x + "px";
      contextMenu.style.top = y + "px";
      contextMenu.classList.remove("hidden");
    }
  }

  public hideContextMenu(): void {
    const contextMenu = document.getElementById("contextMenu");
    if (contextMenu) {
      contextMenu.classList.add("hidden");
    }
  }

  public showElementTypeSelection(): void {
    const selector = document.getElementById("elementTypeSelection");
    if (selector) selector.classList.remove("hidden");
  }

  public hideElementTypeSelection(): void {
    const selector = document.getElementById("elementTypeSelection");
    if (selector) selector.classList.add("hidden");
  }

  public updateCanvasCursor(mode: string): void {
    this.canvas.className = `canvas ${mode}-mode`;
  }

  public updateStatus(statusText: string): void {
    const status = document.getElementById("status");
    if (status) {
      status.textContent = statusText;
    }
  }

  public setCanvasTransform(zoom: number, panX: number, panY: number): void {
    this.canvas.style.transform = `scale(${zoom}) translate(${panX}px, ${panY}px)`;
  }
}
