import { App } from "./App.ts";
import {
  ELEMENT_STATES_CSS,
  initializeStateObserver,
} from "./RenderLayer/DynamicCSS.ts";

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

document.head.insertAdjacentHTML(
  "beforeend",
  `<style>${ELEMENT_STATES_CSS}</style>`
);
initializeStateObserver();

export { App } from "./App.ts";
export * from "./types.ts";
