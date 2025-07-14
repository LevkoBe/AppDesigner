import { App } from "./App.ts";

declare global {
  interface Window {
    app: App;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  try {
    const app = new App();

    // available globally for debugging
    window.app = app;

    console.log("Application initialized successfully");
  } catch (error) {
    console.error("Failed to initialize application:", error);
    alert(
      "Failed to initialize application. Please check the console for more details."
    );
  }
});

export { App } from "./App.ts";
export * from "./types.ts";
export * from "./models/Element.ts";
export * from "./models/Connection.ts";
export * from "./state/AppState.ts";
