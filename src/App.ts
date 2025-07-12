import { AppState } from "./state/AppState.ts";
import { DOMManager } from "./ui/DOMManager.ts";
import { EventHandlers } from "./handlers/EventHandlers.ts";
import { ContextMenu } from "./ui/ContextMenu.ts";
import { ProjectManager } from "./utils/ProjectManager.ts";
import { Mode, ElementType } from "./types.ts";
import { ViewControls } from "./ui/ViewControls.ts";
import { PropertiesPanel } from "./ui/PropertiesPanel.ts";

export class App {
  private appState: AppState;
  private domManager: DOMManager;
  private eventHandlers: EventHandlers;
  private contextMenu: ContextMenu;
  private projectManager: ProjectManager;
  private viewControls: ViewControls;
  private propertiesPanel: PropertiesPanel;

  constructor() {
    const canvas = document.getElementById("canvas") as HTMLElement;
    if (!canvas) {
      throw new Error("Canvas element not found");
    }

    this.appState = new AppState();
    this.domManager = new DOMManager(canvas);
    this.propertiesPanel = new PropertiesPanel(this.appState, this.domManager);
    this.eventHandlers = new EventHandlers(
      this.appState,
      this.domManager,
      this.propertiesPanel
    );
    this.contextMenu = new ContextMenu(this.appState, this.domManager);
    this.projectManager = new ProjectManager(this.appState, this.domManager);
    this.viewControls = new ViewControls(this.appState, this.domManager);

    this.initializeApp();
  }

  private initializeApp(): void {
    this.setupEventListeners();
    this.domManager.updateCanvasCursor(this.appState.currentMode);
    this.updateStatus();
    this.render();
  }

  private setupEventListeners(): void {
    const canvas = document.getElementById("canvas") as HTMLElement;

    canvas.addEventListener("click", this.eventHandlers.handleCanvasClick);
    canvas.addEventListener("mousedown", this.eventHandlers.handleMouseDown);
    canvas.addEventListener("mousemove", this.eventHandlers.handleMouseMove);
    canvas.addEventListener("mouseup", this.eventHandlers.handleMouseUp);
    canvas.addEventListener(
      "contextmenu",
      this.eventHandlers.handleContextMenu
    );

    // Prevent default drag behavior on canvas
    canvas.addEventListener("dragstart", (e) => e.preventDefault());

    document.addEventListener("click", this.hideContextMenu);

    document.querySelectorAll(".mode-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        document
          .querySelectorAll(".mode-btn")
          .forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        const mode = (btn as HTMLElement).dataset.mode as Mode;
        this.eventHandlers.handleModeChange(mode);
      });
    });

    document.querySelectorAll(".element-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        document
          .querySelectorAll(".element-btn")
          .forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        const type = (btn as HTMLElement).dataset.type as ElementType;
        this.eventHandlers.handleElementTypeChange(type);
      });
    });

    const editBtn = document.getElementById("editBtn");
    const duplicateBtn = document.getElementById("duplicateBtn");
    const deleteBtn = document.getElementById("deleteBtn");

    if (editBtn)
      editBtn.addEventListener("click", this.contextMenu.editElement);
    if (duplicateBtn)
      duplicateBtn.addEventListener("click", this.contextMenu.duplicateElement);
    if (deleteBtn)
      deleteBtn.addEventListener("click", this.contextMenu.deleteElement);

    const saveBtn = document.getElementById("saveBtn");
    const loadBtn = document.getElementById("loadBtn");
    const clearBtn = document.getElementById("clearBtn");

    if (saveBtn) saveBtn.addEventListener("click", this.saveProject);
    if (loadBtn) loadBtn.addEventListener("click", this.loadProject);
    if (clearBtn) clearBtn.addEventListener("click", this.clearCanvas);

    const zoomInBtn = document.getElementById("zoomInBtn");
    const zoomOutBtn = document.getElementById("zoomOutBtn");
    const resetViewBtn = document.getElementById("resetViewBtn");

    if (zoomInBtn)
      zoomInBtn.addEventListener("click", this.viewControls.zoomIn);
    if (zoomOutBtn)
      zoomOutBtn.addEventListener("click", this.viewControls.zoomOut);
    if (resetViewBtn)
      resetViewBtn.addEventListener("click", this.viewControls.resetView);
  }

  private hideContextMenu = (): void => {
    this.domManager.hideContextMenu();
    this.appState.contextMenuTarget = null;
  };

  private saveProject = (): void => {
    this.projectManager.saveProject();
  };

  private loadProject = (): void => {
    this.projectManager.loadProject();
  };

  private clearCanvas = (): void => {
    if (
      confirm(
        "Are you sure you want to clear the canvas? This action cannot be undone."
      )
    ) {
      this.appState.clear();
      this.propertiesPanel.updatePanel(null);
      document
        .querySelectorAll(".connection-svg")
        .forEach((conn) => conn.remove());
      this.render();
    }
  };

  private updateStatus(): void {
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

    let statusText = `${modeText[this.appState.currentMode]} - ${
      elementText[this.appState.currentElementType]
    }`;

    if (
      this.appState.currentMode === "connection" &&
      this.appState.connectionStart
    ) {
      statusText += " - Select target element";
    }

    this.domManager.updateStatus(statusText);
  }

  private render(): void {
    this.domManager.updateConnections(this.appState.connections);
  }

  public getAppState(): AppState {
    return this.appState;
  }

  public getDOMManager(): DOMManager {
    return this.domManager;
  }

  // Public methods to expose for global access if needed
  public saveProjectPublic(): void {
    this.saveProject();
  }

  public loadProjectPublic(): void {
    this.loadProject();
  }

  public clearCanvasPublic(): void {
    this.clearCanvas();
  }
}
