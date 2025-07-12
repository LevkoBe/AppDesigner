import { AppState } from "../state/AppState.ts";
import { DOMManager } from "./DOMManager.ts";
import { Element } from "../models/Element.ts";

export class PropertiesPanel {
  private appState: AppState;
  private domManager: DOMManager;
  private panelContainer: HTMLElement;
  private textInput: HTMLInputElement;
  private idField: HTMLElement;
  private typeField: HTMLElement;
  private xField: HTMLElement;
  private yField: HTMLElement;

  constructor(appState: AppState, domManager: DOMManager) {
    this.appState = appState;
    this.domManager = domManager;
    this._createPanel();
  }

  private _createPanel(): void {
    this.panelContainer = document.createElement("div");
    this.panelContainer.id = "propertiesPanel";
    this.panelContainer.style.position = "fixed";
    this.panelContainer.style.right = "10px";
    this.panelContainer.style.top = "70px";
    this.panelContainer.style.width = "250px";
    this.panelContainer.style.backgroundColor = "#333";
    this.panelContainer.style.color = "#eee";
    this.panelContainer.style.padding = "15px";
    this.panelContainer.style.borderRadius = "8px";
    this.panelContainer.style.display = "none";
    this.panelContainer.style.fontFamily = "sans-serif";
    this.panelContainer.style.zIndex = "1001";
    this.panelContainer.style.boxShadow = "0 4px 8px rgba(0,0,0,0.3)";

    const title = document.createElement("h3");
    title.textContent = "Element Properties";
    title.style.marginTop = "0";
    title.style.borderBottom = "1px solid #555";
    title.style.paddingBottom = "10px";
    this.panelContainer.appendChild(title);

    this.idField = this._createReadOnlyProperty("ID");
    this.typeField = this._createReadOnlyProperty("Type");
    this.xField = this._createReadOnlyProperty("Pos X");
    this.yField = this._createReadOnlyProperty("Pos Y");

    const nameLabel = document.createElement("strong");
    nameLabel.textContent = "Name:";
    nameLabel.style.display = "block";
    nameLabel.style.marginTop = "10px";

    this.textInput = document.createElement("input");
    this.textInput.type = "text";
    this.textInput.style.width = "calc(100% - 16px)";
    this.textInput.style.padding = "8px";
    this.textInput.style.marginTop = "5px";
    this.textInput.style.border = "1px solid #555";
    this.textInput.style.borderRadius = "4px";
    this.textInput.style.backgroundColor = "#444";
    this.textInput.style.color = "#eee";

    this.panelContainer.appendChild(nameLabel);
    this.panelContainer.appendChild(this.textInput);

    this.textInput.addEventListener("input", this._handleTextChange);

    document.body.appendChild(this.panelContainer);
  }

  private _createReadOnlyProperty(label: string): HTMLElement {
    const row = document.createElement("div");
    row.style.margin = "8px 0";
    const valueSpan = document.createElement("span");
    valueSpan.style.marginLeft = "5px";
    row.innerHTML = `<strong>${label}:</strong>`;
    row.appendChild(valueSpan);
    this.panelContainer.appendChild(row);
    return valueSpan;
  }

  public updatePanel = (element: Element | null): void => {
    if (!element) {
      this.panelContainer.style.display = "none";
      return;
    }

    this.panelContainer.style.display = "block";
    this.idField.textContent = element.id.toString();
    this.typeField.textContent = element.type;
    this.textInput.value = element.text;
    this.xField.textContent = Math.round(element.x).toString();
    this.yField.textContent = Math.round(element.y).toString();
  };

  public updatePosition(element: Element): void {
    if (this.appState.selectedElement === element) {
      this.xField.textContent = Math.round(element.x).toString();
      this.yField.textContent = Math.round(element.y).toString();
    }
  }

  private _handleTextChange = (): void => {
    const selectedElement = this.appState.selectedElement;
    if (selectedElement) {
      selectedElement.text = this.textInput.value;
      this.domManager.updateElementTextContent(selectedElement);
    }
  };
}
