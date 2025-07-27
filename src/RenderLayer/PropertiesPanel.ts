import { AppElement } from "../_models/AppElement.ts";

export class PropertiesPanel {
  private panelContainer = document.getElementById("rightBar")!;
  private textInput = this._createInputField("Name");
  private idField = this._createReadOnlyProperty("ID");
  private typeField = this._createReadOnlyProperty("Type");
  private xField = this._createReadOnlyProperty("Pos X");
  private yField = this._createReadOnlyProperty("Pos Y");

  private _createReadOnlyProperty(label: string): HTMLElement {
    return this._createElement(
      "readonlyPropTemplate",
      "readonlyProps",
      ".propValue",
      label
    );
  }

  private _createInputField(label: string): HTMLInputElement {
    const input = this._createElement(
      "inputFieldTemplate",
      "inputFields",
      ".propInput",
      label
    ) as HTMLInputElement;
    input.name = label;
    input.autocomplete = "off";
    return input;
  }

  private _createElement(
    templateId: string,
    containerId: string,
    keyelementClass: string,
    label: string
  ): HTMLElement {
    const clone = document
      .getElementById(templateId)!
      .cloneNode(true) as HTMLElement;
    clone.id = "";

    clone.querySelector(".propLabel")!.textContent = label;

    document.getElementById(containerId)!.appendChild(clone);

    return clone.querySelector(keyelementClass)! as HTMLElement;
  }

  updatePanel = (element: AppElement | undefined) => {
    if (!element) {
      this.panelContainer.classList.add("hid");
      return;
    }

    this.panelContainer.classList.remove("hid");
    this.idField.textContent = element.id.toString();
    this.typeField.textContent = element.type;
    this.textInput.value = element.text;
    this.xField.textContent = Math.round(element.x).toString();
    this.yField.textContent = Math.round(element.y).toString();
  };

  getInputs(): HTMLInputElement[] {
    return [this.textInput];
  }
}
