import { AppElement } from "../_models/AppElement.js";
import { ElementType, elementTypeList } from "../types.js";

export class ElementFactory {
  private elementTemplates: Map<ElementType, HTMLElement>;

  constructor() {
    this.elementTemplates = new Map();
    this.loadElementTemplates();
  }

  private loadElementTemplates() {
    const templateContainer = document.getElementById(
      "elementTemplates"
    ) as HTMLElement;
    if (!templateContainer) throw new Error(`No template`);

    Array.from(templateContainer.children).forEach((child) => {
      if (
        child instanceof HTMLElement &&
        child.classList.contains("template")
      ) {
        const type: ElementType | undefined = elementTypeList.find((t) =>
          child.classList.contains(t)
        );
        if (!type) throw new Error(`Undefined type`);
        this.elementTemplates.set(type, child);
      }
    });
  }

  createDOMElement(element: AppElement, canvas: HTMLElement): HTMLElement {
    const template = this.elementTemplates.get(element.type);
    if (!template) throw new Error(`No template`);

    const domElement = template.cloneNode(true) as HTMLElement;
    domElement.classList.remove("template");
    domElement.dataset.id = element.id;

    canvas.appendChild(domElement);
    return domElement;
  }

  updateElement(domElement: HTMLElement, element: AppElement) {
    domElement.style.left = element.x - element.width / 2 + "px";
    domElement.style.top = element.y - element.height / 2 + "px";
    domElement.style.width = element.width + "px";
    domElement.style.height = element.height + "px";

    const textSpan = domElement.querySelector(".element-text") as HTMLElement;
    const input = domElement.querySelector(
      ".element-input"
    ) as HTMLInputElement;

    if (!textSpan || !input) throw new Error(`No text/input`);
    textSpan.textContent = element.text;
    input.value = element.text;

    this.updateStateClass(domElement, "has-parent", !!element.parent);
    this.updateStateClass(
      domElement,
      "has-children",
      !!element.children.length
    );
    this.updateStateClass(domElement, "is-anchored", element.isAnchored);
  }

  updateStateClass(
    domElement: HTMLElement,
    className: string,
    condition: boolean
  ) {
    domElement.classList.toggle(className, condition);
  }

  updateSelectedState(domElement: HTMLElement, isSelected: boolean) {
    this.updateStateClass(domElement, "selected", isSelected);
  }

  updateIsActiveState(domElement: HTMLElement, isActive: boolean) {
    this.updateStateClass(domElement, "is-active", isActive);
  }

  updateDraggingState(domElement: HTMLElement, isDragging: boolean) {
    this.updateStateClass(domElement, "dragging", isDragging);
  }

  updateEditingState(
    domElement: HTMLElement,
    element: AppElement,
    isEditing: boolean
  ) {
    const textSpan = domElement.querySelector(".element-text") as HTMLElement;
    const input = domElement.querySelector(
      ".element-input"
    ) as HTMLInputElement;

    if (!textSpan || !input) return;

    if (isEditing) {
      textSpan.style.display = "none";
      input.style.display = "block";
      input.focus();
      input.value = element.text;
    } else {
      textSpan.style.display = "block";
      input.style.display = "none";
      textSpan.textContent = element.text;
    }
  }
}
