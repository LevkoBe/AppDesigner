import { App } from "./App.ts";

declare global {
  interface Window {
    app: App;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  try {
    const canvas = document.getElementById("canvas") as HTMLCanvasElement;
    const app = new App(canvas);
    window.app = app;
    console.log("Application initialized successfully");
  } catch (error) {
    console.error("Failed to initialize application:", error);
    alert("Failed to initialize application. Check console for details.");
  }
});

export { App } from "./App.ts";
export * from "./types.ts";
