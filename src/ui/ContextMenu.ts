import { AppState } from "../state/AppState.ts";
import { DOMManager } from "./DOMManager.ts";
import { AppElement } from "../models/Element.ts";

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
      const newElement = new AppElement(
        this.appState.contextMenuTarget.type,
        this.appState.contextMenuTarget.x + 20,
        this.appState.contextMenuTarget.y + 20,
        this.appState.contextMenuTarget.text
      );
      this.appState.addElement(newElement);
      this.domManager.createElementDOM(newElement);
      this.appState.selectElement(newElement);
      // this.domManager.updatePropertyPanel(newElement);
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

    // Remove from parent's children array
    if (element.parent) {
      element.parent.children = element.parent.children.filter(
        (child) => child.id !== id
      );
    }

    // Recursively delete all children
    element.children.forEach((child) => {
      this.deleteElementById(child.id);
    });

    // Remove all connections involving this element
    this.appState.connections = this.appState.connections.filter(
      (conn) => conn.from.id !== id && conn.to.id !== id
    );

    // Remove DOM element
    if (element.domElement) {
      element.domElement.remove();
    }

    // Remove from app state
    this.appState.removeElement(id);

    // Clear selection if this element was selected
    if (this.appState.selectedElement?.id === id) {
      this.appState.selectedElement = null;
      // this.domManager.clearPropertyPanel();
    }

    // Clear connection start if this element was the connection start
    if (this.appState.connectionStart?.id === id) {
      this.appState.connectionStart = null;
    }

    this.render();
  }

  private render(): void {
    this.domManager.updateConnections(this.appState.connections);
  }
}
