import { AppState } from "../state/AppState.ts";
import { DOMManager } from "../ui/DOMManager.ts";
import { Element } from "../models/Element.ts";
import { Connection } from "../models/Connection.ts";
import { ProjectData } from "../types.ts";

export class ProjectManager {
  private appState: AppState;
  private domManager: DOMManager;

  constructor(appState: AppState, domManager: DOMManager) {
    this.appState = appState;
    this.domManager = domManager;
  }

  public saveProject(): void {
    const project: ProjectData = {
      elements: this.appState.elements.map((e) => e.serialize()),
      connections: this.appState.connections.map((c) => c.serialize()),
    };
    const data = JSON.stringify(project, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "application_design.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  public loadProject(): void {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const result = e.target?.result;
            if (typeof result === "string") {
              const project: ProjectData = JSON.parse(result);
              this.clearCanvas();

              project.elements.forEach((elementData) => {
                const element = new Element(
                  elementData.type,
                  elementData.x,
                  elementData.y,
                  elementData.text
                );
                element.id = elementData.id;
                element.width = elementData.width;
                element.height = elementData.height;
                this.appState.addElement(element);
                this.domManager.createElementDOM(element);
              });

              project.connections.forEach((connData) => {
                const from = this.appState.getElementById(connData.from);
                const to = this.appState.getElementById(connData.to);
                if (from && to) {
                  const connection = new Connection(from, to);
                  connection.id = connData.id;
                  this.appState.addConnection(connection);
                }
              });

              this.render();
            }
          } catch (error) {
            alert("Error loading project: " + (error as Error).message);
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  }

  private clearCanvas(): void {
    this.appState.clear();
    document
      .querySelectorAll(".connection-svg")
      .forEach((conn) => conn.remove());
  }

  private render(): void {
    this.domManager.updateConnections(this.appState.connections);
  }
}
