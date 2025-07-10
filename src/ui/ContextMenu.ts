import { AppState } from "../state/AppState.ts";
import { DOMManager } from "./DOMManager.ts";
import { Element } from "../models/Element.ts";

export class ContextMenu {
  private appState: AppState;
  private domManager: DOMManager;

  constructor(appState: AppState, domManager: DOMManager) {
    this.appState = appState;
    this.domManager = domManager;
  }

  public editElement = (): void => {
    if (this.appState.contextMenuTarget) {
      this.domManager.editElementText(this.appState.contextMenuTarget);
    }
    this.hideContextMenu();
  };

  public duplicateElement = (): void => {
    if (this.appState.contextMenuTarget) {
      const newElement = new Element(
        this.appState.contextMenuTarget.type,
        this.appState.contextMenuTarget.x + 20,
        this.appState.contextMenuTarget.y + 20,
        this.appState.contextMenuTarget.text
      );
      this.appState.addElement(newElement);
      this.domManager.createElementDOM(newElement);
      this.appState.selectElement(newElement);
      this.render();
    }
    this.hideContextMenu();
  };

  public deleteElement = (): void => {
    if (this.appState.contextMenuTarget) {
      this.deleteElementById(this.appState.contextMenuTarget.id);
    }
    this.hideContextMenu();
  };

  private hideContextMenu(): void {
    this.domManager.hideContextMenu();
    this.appState.contextMenuTarget = null;
  }

  private deleteElementById(id: number): void {
    const element = this.appState.getElementById(id);
    if (!element) return;

    if (element.parent) {
      element.parent.children = element.parent.children.filter(
        (child) => child.id !== id
      );
    }

    element.children.forEach((child) => {
      this.deleteElementById(child.id);
    });

    this.appState.connections = this.appState.connections.filter(
      (conn) => conn.from.id !== id && conn.to.id !== id
    );

    if (element.domElement) {
      element.domElement.remove();
    }
    this.appState.removeElement(id);

    if (this.appState.selectedElement?.id === id) {
      this.appState.selectedElement = null;
    }

    this.render();
  }

  private render(): void {
    this.domManager.updateConnections(this.appState.connections);
  }
}
