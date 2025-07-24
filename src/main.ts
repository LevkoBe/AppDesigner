import { App } from "./App.ts";
import { initializeStateObserver } from "./RenderLayer/DynamicCSS.ts";

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
  } catch (error) {
    console.error("Failed to initialize application:", error);
  }
});

initializeStateObserver();

export { App } from "./App.ts";
export * from "./types.ts";
