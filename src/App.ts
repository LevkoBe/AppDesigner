import { InputState } from "./InputLayer/InputState.js";
import { LogicLayer } from "./LogicLayer/LogicLayer.js";
import { RenderLayer } from "./RenderLayer/RenderLayer.js";
import { InputLayer } from "./InputLayer/InputLayer.js";
import { AppState } from "./LogicLayer/AppState.js";

export class App {
  private appState: AppState;
  private inputState: InputState;
  private logicLayer: LogicLayer;
  private renderLayer: RenderLayer;
  private inputLayer: InputLayer;

  constructor(canvasElement: HTMLCanvasElement) {
    this.appState = new AppState();
    this.inputState = new InputState();
    this.logicLayer = new LogicLayer(this.inputState, this.appState);
    this.renderLayer = new RenderLayer(canvasElement, this.appState);
    this.inputLayer = new InputLayer(
      canvasElement,
      this.inputState,
      () => this.appState.elements,
      () => this.renderLayer.getActivePanelInputs()
    );

    this.setupAsyncHandlers();

    this.start();
  }

  private setupAsyncHandlers(): void {
    this.inputLayer.handleDeleteConfirmed = (elementId: string) => {
      this.inputState.interpretDelete(elementId);
    };
  }

  private start(): void {
    const updateLoop = () => {
      try {
        if (
          this.inputState.getAction !== "none" ||
          this.appState.rerenderNeeded ||
          this.appState.autoLayout
        ) {
          this.logicLayer.processInput();
          this.renderLayer.render();
          this.inputState.clear();
        }
      } catch (error) {
        console.error("Error in update cycle:", error);
      }

      requestAnimationFrame(updateLoop);
    };

    requestAnimationFrame(updateLoop);
  }

  save(): string {
    return this.appState.serialize();
  }

  load(data: string): void {
    try {
      this.appState.deserialize(data);
      this.renderLayer.render();
    } catch (error) {
      console.error("Failed to load data:", error);
    }
  }

  exportModel() {
    return this.appState.serialize();
  }

  importModel(model: AppState) {
    this.appState.deserialize(JSON.stringify(model));
    this.renderLayer.render();
  }
}
