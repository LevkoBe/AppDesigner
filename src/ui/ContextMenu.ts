import { AppState } from "../state/AppState.ts";
import { DOMManager } from "./DOMManager.ts";
import { AppElement } from "../models/Element.ts";

export class ContextMenu {
  private appState: AppState;
  private domManager: DOMManager;

  constructor(appState: AppState, domManager: DOMManager) {
    this.appState = appState;
    this.domManager = domManager;
    this.setupContextMenuEvents();
  }

  private setupContextMenuEvents(): void {
    document
      .getElementById("editBtn")
      ?.addEventListener("click", this.editElement);
    document
      .getElementById("duplicateBtn")
      ?.addEventListener("click", this.duplicateElement);
    document
      .getElementById("deleteBtn")
      ?.addEventListener("click", this.deleteElement);
  }

  public editElement = (): void => {
    if (this.appState.selectedElement) {
      this.domManager.editElementText(this.appState.selectedElement);
    }
    this.hideContextMenu();
  };

  public duplicateElement = (): void => {
    if (this.appState.selectedElement) {
      const newElement = new AppElement(
        this.appState.selectedElement.type,
        this.appState.selectedElement.centerX + 20,
        this.appState.selectedElement.centerY + 20
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
    if (this.appState.selectedElement) {
      this.deleteElementById(this.appState.selectedElement.id);
    }
    this.hideContextMenu();
  };

  private hideContextMenu(): void {
    // this.domManager.hideContextMenu();
    this.appState.selectedElement = undefined;
  }

  private deleteElementById(id: string): void {
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
      this.appState.selectedElement = undefined;
      // this.domManager.clearPropertyPanel();
    }

    // Clear connection start if this element was the connection start
    if (this.appState.fromElement?.id === id) {
      this.appState.fromElement = undefined;
    }

    this.render();
  }

  private render(): void {
    this.domManager.updateConnections(this.appState.connections);
  }
}
