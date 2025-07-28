import { Mode } from "fs";
import { Action, ElementType } from "../types";

export class TopBar {
  private createButtons: Map<ElementType, HTMLElement> = new Map<
    ElementType,
    HTMLElement
  >();
  private modeButtons: Map<Mode, HTMLElement> = new Map<Mode, HTMLElement>();
  private projectButtons: Map<Action, HTMLElement> = new Map<
    Action,
    HTMLElement
  >();
  private appearanceButtons: Map<Action, HTMLElement> = new Map<
    Action,
    HTMLElement
  >();

  constructor() {
    this.createButtons = this.getDict<ElementType>("[data-create]");
    this.modeButtons = this.getDict<ElementType>("[data-mode]");
    this.projectButtons = this.getDict<Action>("[data-project]");
    this.appearanceButtons = this.getDict<Action>("[data-appearance]");
  }

  private setupActiveButtonGroup(
    selector: string,
    callback: (value: string) => void
  ) {
    document.querySelectorAll(selector).forEach((btn) => {
      btn.addEventListener("click", () => {
        const isToggle = btn.classList.contains("toggle");

        if (isToggle) {
          btn.classList.toggle("active");
        } else {
          document.querySelectorAll(selector).forEach((b) => {
            if (!b.classList.contains("toggle")) {
              b.classList.remove("active");
            }
          });

          btn.classList.add("active");
        }

        const key = selector.replace("[data-", "").replace("]", "");
        const value = (btn as HTMLElement).dataset[key];
        if (value) {
          callback(value);
        }
      });
    });
  }

  updateCreate(elementType: ElementType, shiftKey: boolean = false) {
    this.createButtons.forEach((v, k) => {
      if (k !== elementType) v.classList.remove("active");
      else v.classList.add(shiftKey ? "danger" : "active");
    });
  }

  updateMode(mode: Mode) {
    const danger = mode === "remove" || mode === "disconnect";
    this.modeButtons.forEach((v, k) => {
      if (k !== mode) v.classList.remove("active");
      else v.classList.add(danger && k === "create" ? "danger" : "active");
    });
  }

  updateAppearance(layout: boolean = true, details: boolean = true) {
    this.appearanceButtons.forEach((v) => v.classList.remove("active"));
    if (layout) this.appearanceButtons.get("layout")?.classList.add("active");
    if (details) this.appearanceButtons.get("details")?.classList.add("active");
  }

  private getDict<T>(selector: string): Map<T, HTMLElement> {
    const newDict: Map<T, HTMLElement> = new Map<T, HTMLElement>();
    const key = selector.replace("[data-", "").replace("]", "");

    document.querySelectorAll(selector).forEach((btn) => {
      const htmlButton = btn as HTMLElement;
      const value = htmlButton.dataset[key];
      if (!value) throw new Error(`No value (key: ${key})`);
      newDict.set(value as T, htmlButton);
    });

    return newDict;
  }
}
