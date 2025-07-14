import { AppState } from "../state/AppState.ts";
import { DOMManager } from "../ui/DOMManager.ts";
import { PropertiesPanel } from "../ui/PropertiesPanel.ts";
import { Connection } from "../models/Connection.ts";
import { AppElement } from "../models/Element.ts";
import { ElementType, Mode } from "../types.ts";

export class ElementUtilities {
  constructor(
    private state: AppState,
    private dom: DOMManager,
    private panel: PropertiesPanel
  ) {}

  public createElementAt(
    x: number,
    y: number,
    parent: AppElement | null = null
  ): AppElement {
    const element = new AppElement(
      this.state.currentElementType,
      x,
      y,
      "",
      parent
    );
    this.state.addElement(element);
    this.dom.createElementDOM(element);
    this.state.selectElement(element);
    this.panel.updatePanel(element);
    this.render();
    return element;
  }

  public createChildElement(parent: AppElement): AppElement {
    const childX = parent.centerX + parent.width + 30;
    const childY = parent.centerY + parent.children.length * 55;
    return this.createElementAt(childX, childY, parent);
  }

  public deleteElementById(id: number): void {
    const el = this.state.getElementById(id);
    if (!el) return;

    if (el.parent) {
      el.parent.children = el.parent.children.filter((ch) => ch.id !== id);
    }

    el.children.forEach((child) => this.deleteElementById(child.id));

    this.state.connections = this.state.connections.filter(
      (conn) => conn.from.id !== id && conn.to.id !== id
    );

    el.domElement?.remove();
    this.state.removeElement(id);

    if (this.state.selectedElement?.id === id) {
      this.state.selectedElement = null;
      this.panel.updatePanel(null);
    }

    if (this.state.connectionStart?.id === id) {
      this.state.connectionStart = null;
    }

    this.render();
  }

  public createConnection(from: AppElement, to: AppElement): void {
    const exists = this.state.connections.some(
      (c) =>
        (c.from.id === from.id && c.to.id === to.id) ||
        (c.from.id === to.id && c.to.id === from.id)
    );
    if (exists) return;

    const conn = new Connection(from, to);
    this.state.addConnection(conn);
    this.dom.updateConnections(this.state.connections);
  }

  public resetConnectionState(): void {
    this.state.connectionStart?.domElement?.classList.remove(
      "connection-source"
    );
    this.state.connectionStart = null;
    this.updateStatus();
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

    let statusText = `${modeText[this.state.currentMode]}`;
    if (this.state.currentMode === "create")
      statusText += ` - ${elementText[this.state.currentElementType]}`;

    if (this.state.currentMode === "connection" && this.state.connectionStart) {
      statusText += " - Select target element";
    }

    this.dom.updateStatus(statusText);
  }

  private render(): void {
    this.dom.updateConnections(this.state.connections);
  }
}
