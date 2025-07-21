import { AppState } from "../state/AppState.ts";

export class ProjectManager {
  constructor(private appState: AppState) {}

  saveProject(): void {
    const data = this.appState.serialize();
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "application_design.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  loadProject(): void {
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
              this.appState.deserialize(result);
              this.appState.rerenderNeeded = true;
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
}
