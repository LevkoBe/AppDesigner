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
  } catch (error) {
    console.error("Failed to initialize application:", error);
  }
});

export { App } from "./App.ts";
export * from "./types.ts";
