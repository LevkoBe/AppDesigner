import { RuleResult } from "../LogicLayer/utils/RuleEngine";

export class RuleFeedback {
  private popup: HTMLElement | null = null;
  private hideTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.popup = document.getElementById("popup");
  }

  show(ruleResult: RuleResult) {
    if (!this.popup) return;

    const messageEl = this.popup.querySelector(".message");
    const ruleEl = this.popup.querySelector(".description");

    if (messageEl)
      messageEl.textContent =
        "Rule: " + (ruleResult.message || "Action not allowed");
    if (ruleEl) ruleEl.textContent = ruleResult.ruleName;

    this.popup.classList.remove("hide");
    void this.popup.offsetWidth;
    this.popup.classList.add("show");

    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
    }

    this.hideTimeout = setTimeout(() => {
      this.hide();
    }, 5000);
  }

  hide() {
    if (this.popup && this.popup.classList.contains("show")) {
      this.popup.classList.remove("show");
      void this.popup.offsetWidth;
      this.popup.classList.add("hide");
    }
  }
}
