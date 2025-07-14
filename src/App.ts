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
    this.domManager.updateStatus("Ready");
    this.render();
  }

  private setupEventListeners(): void {
    this.setupCanvasEvents();
    this.setupUIEvents();
    this.setupContextMenuEvents();
    this.setupProjectEvents();
    this.setupViewControlEvents();
  }

  private setupCanvasEvents(): void {
    const canvas = document.getElementById("canvas") as HTMLElement;

    canvas.addEventListener("click", this.eventHandlers.handleCanvasClick);
    canvas.addEventListener("mousedown", this.eventHandlers.handleMouseDown);
    canvas.addEventListener("mousemove", this.eventHandlers.handleMouseMove);
    canvas.addEventListener("mouseup", this.eventHandlers.handleMouseUp);
    canvas.addEventListener(
      "contextmenu",
      this.eventHandlers.handleContextMenu
    );
    canvas.addEventListener("dragstart", (e) => e.preventDefault());

    document.addEventListener("click", this.hideContextMenu);
  }

  private setupUIEvents(): void {
    this.setupModeButtons();
    this.setupElementTypeButtons();
  }

  private setupModeButtons(): void {
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
  }

  private setupElementTypeButtons(): void {
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
  }

  private setupContextMenuEvents(): void {
    const editBtn = document.getElementById("editBtn");
    const duplicateBtn = document.getElementById("duplicateBtn");
    const deleteBtn = document.getElementById("deleteBtn");

    if (editBtn)
      editBtn.addEventListener("click", this.contextMenu.editElement);
    if (duplicateBtn)
      duplicateBtn.addEventListener("click", this.contextMenu.duplicateElement);
    if (deleteBtn)
      deleteBtn.addEventListener("click", this.contextMenu.deleteElement);
  }

  private setupProjectEvents(): void {
    const saveBtn = document.getElementById("saveBtn");
    const loadBtn = document.getElementById("loadBtn");
    const clearBtn = document.getElementById("clearBtn");

    if (saveBtn) saveBtn.addEventListener("click", this.handleSaveProject);
    if (loadBtn) loadBtn.addEventListener("click", this.handleLoadProject);
    if (clearBtn) clearBtn.addEventListener("click", this.handleClearCanvas);
  }

  private setupViewControlEvents(): void {
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

  private handleSaveProject = (): void => {
    this.projectManager.saveProject();
  };

  private handleLoadProject = (): void => {
    this.projectManager.loadProject();
  };

  private handleClearCanvas = (): void => {
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

  private render(): void {
    this.domManager.updateConnections(this.appState.connections);
  }

  public getAppState(): AppState {
    return this.appState;
  }

  public getDOMManager(): DOMManager {
    return this.domManager;
  }

  public saveProject(): void {
    this.handleSaveProject();
  }

  public loadProject(): void {
    this.handleLoadProject();
  }

  public clearCanvas(): void {
    this.handleClearCanvas();
  }
}
