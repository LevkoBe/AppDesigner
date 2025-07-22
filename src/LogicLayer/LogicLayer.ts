import { InputState } from "../InputLayer/InputState.js";
import { ForceDirectedLayout } from "./utils/ForceDirectedLayout.js";
import { Connection } from "../_models/Connection.js";
import { AppElement } from "../_models/AppElement.js";
import { AppState } from "./AppState.js";
import { ProjectManager } from "./utils/ProjectManager.js";

export class LogicLayer {
  private projectManager: ProjectManager;
  private layout: ForceDirectedLayout;

  constructor(
    private inputState: InputState,
    private appState: AppState,
    canvasElement: HTMLCanvasElement
  ) {
    this.projectManager = new ProjectManager(appState);
    this.layout = new ForceDirectedLayout(canvasElement);
  }

  processInput() {
    let activeId: string | undefined = this.inputState.activeId;
    let secondaryId: string | undefined = this.inputState.secondaryId;

    if (!this.inputState.isEditing) this.appState.editingElement = undefined;

    switch (this.inputState.getAction) {
      case "layout":
        this.appState.autoLayout = !this.appState.autoLayout;
        if (this.appState.autoLayout) {
          this.restartLayout();
        } else {
          this.layout.stop();
        }
        break;

      case "create":
        this.appState.contextMenu = false;
        activeId = this.handleCreate();
        this.tryRestartLayout();
        break;

      case "move":
        this.handleMove();
        this.tryRestartLayout();
        break;

      case "connect":
        this.handleConnect();
        activeId = this.inputState.activeId;
        secondaryId = undefined;
        this.tryRestartLayout();
        break;

      case "select":
        activeId = this.handleSelect();
        break;

      case "anchor":
        this.handleAnchor();
        break;

      case "delete":
        this.appState.contextMenu = false;
        this.handleDelete();
        this.tryRestartLayout();
        activeId = undefined;
        break;

      case "edit":
        this.appState.contextMenu = false;
        this.handleEdit();
        break;

      case "menu":
        this.appState.contextMenu = true;
        this.appState.targetPosition = this.inputState.mousePosition;
        break;

      case "save":
        this.projectManager.saveProject();
        break;

      case "load":
        this.projectManager.loadProject();
        this.tryRestartLayout();
        break;

      case "clear":
        this.appState.clear();
        this.layout.stop();
        break;

      case "zoomIn":
      case "zoomOut":
      case "resetView":
        this.appState.zoom = this.inputState.zoom;
        this.appState.pan = this.inputState.pan;
        break;

      case "changeMode":
        this.appState.currentMode = this.inputState.currentMode;
        break;
    }

    this.appState.selectedElement = activeId
      ? this.appState.getElementById(activeId)
      : undefined;
    this.appState.fromElement = secondaryId
      ? this.appState.getElementById(secondaryId)
      : undefined;
    this.inputState.activeId = activeId;
    this.inputState.secondaryId = secondaryId;
  }

  private handleCreate(): string | undefined {
    if (!this.inputState.mousePosition) return;

    const { x, y } = this.inputState.mousePosition;
    const parentId = this.inputState.activeId;
    const parent = parentId
      ? this.appState.getElementById(parentId) ?? undefined
      : undefined;
    const element = new AppElement(this.inputState.elementType, x, y, parent);
    this.appState.addElement(element);
    this.inputState.activeId = element.id;
    return element.id;
  }

  private handleMove() {
    if (this.inputState.secondaryId && this.inputState.mousePosition) {
      const element = this.appState.getElementById(this.inputState.secondaryId);
      if (element) {
        element.x = this.inputState.mousePosition.x;
        element.y = this.inputState.mousePosition.y;
      }
    }
  }

  private handleConnect() {
    const fromElement = this.appState.getElementById(
      this.inputState.secondaryId!
    )!;
    const toElement = this.appState.getElementById(this.inputState.activeId!)!;

    const connectionExists = this.appState.connections.some(
      (conn) =>
        (conn.from.id === fromElement.id && conn.to.id === toElement.id) ||
        (conn.from.id === toElement.id && conn.to.id === fromElement.id)
    );

    if (!connectionExists) {
      const connection = new Connection(fromElement, toElement);
      this.appState.addConnection(connection);
    }
  }

  private handleSelect(): string | undefined {
    return this.inputState.activeId;
  }

  private handleAnchor() {
    const element = this.appState.getElementById(this.inputState.activeId!)!;
    element.isAnchored = !element.isAnchored;
  }

  private handleDelete() {
    const deleteRecursively = (id: string) => {
      const element = this.appState.getElementById(id);
      if (!element) return;

      element.children.forEach((c) => deleteRecursively(c.id));
      this.appState.removeConnectionsFor(element.id);
      this.appState.removeElement(id);
    };

    if (this.inputState.activeId) deleteRecursively(this.inputState.activeId);
  }

  private handleEdit() {
    if (this.inputState.activeId) {
      const el = this.appState.getElementById(this.inputState.activeId);
      this.appState.editingElement = el;
      if (this.inputState.text !== undefined && el)
        el.text = this.inputState.text;
    }
  }

  private restartLayout() {
    this.layout.stop();
    this.layout.start(this.appState.elements, this.appState.connections);
  }

  private tryRestartLayout() {
    if (this.appState.autoLayout) {
      this.restartLayout();
    }
  }
}
