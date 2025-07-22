import { AppState } from "../AppState.ts";

export class ProjectManager {
  constructor(private appState: AppState) {}

  saveProject(): void {
    const data = this.appState.serialize();
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "application_design.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  loadProject(): Promise<void> {
    return new Promise((resolve, reject) => {
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
                resolve();
              } else {
                reject(new Error("Failed to read file as text"));
              }
            } catch (error) {
              const errorMessage =
                error instanceof Error ? error.message : "Unknown error";
              alert("Error loading project: " + errorMessage);
              reject(error);
            }
          };
          reader.onerror = () => {
            const error = new Error("Failed to read file");
            alert("Error reading file");
            reject(error);
          };
          reader.readAsText(file);
        } else {
          reject(new Error("No file selected"));
        }
      };

      input.oncancel = () => {
        resolve();
      };

      document.body.appendChild(input);
      input.click();
      document.body.removeChild(input);
    });
  }
}
