import { AppElement } from "../../_models/AppElement";
import { Connection } from "../../_models/Connection";
import { AppState } from "../AppState";

export interface RuleContext {
  appState: AppState;
  fromElement?: AppElement;
  toElement?: AppElement;
  element?: AppElement;
  connection?: Connection;
}

export interface RuleResult {
  allowed: boolean;
  message?: string;
  ruleName: string;
}

export interface Rule {
  name: string;
  description: string;
  evaluate(context: RuleContext): RuleResult;
}

export class RuleEngine {
  private rules: Rule[] = [];

  constructor() {
    // hardcoded rules
    this.registerRule(new TypeMatchRule());
    this.registerRule(new NoLoopsRule());
    this.registerRule(new IOCompatibilityRule());
    this.registerRule(new DepthMatchRule());
  }

  registerRule(rule: Rule) {
    this.rules.push(rule);
  }

  evaluateConnection(
    fromElement: AppElement,
    toElement: AppElement,
    appState: AppState
  ): RuleResult[] {
    const context: RuleContext = {
      appState,
      fromElement,
      toElement,
    };

    return this.rules.map((rule) => rule.evaluate(context));
  }

  evaluateElementCreation(
    element: AppElement,
    appState: AppState
  ): RuleResult[] {
    const context: RuleContext = {
      appState,
      element,
    };

    return this.rules.map((rule) => rule.evaluate(context));
  }

  getBlockingResult(results: RuleResult[]): RuleResult | null {
    return results.find((result) => !result.allowed) || null;
  }
}

class TypeMatchRule implements Rule {
  name = "Type Match";
  description = "Outputs can only connect to compatible Inputs";

  evaluate(context: RuleContext): RuleResult {
    const { fromElement, toElement } = context;

    if (!fromElement || !toElement) {
      return { allowed: true, ruleName: this.name };
    }

    if (fromElement.type === "output" && toElement.type === "input") {
      // check subtypes here
      return { allowed: true, ruleName: this.name };
    }

    return { allowed: true, ruleName: this.name };
  }
}

class NoLoopsRule implements Rule {
  name = "No Loops";
  description = "Prevents circular connections that would create loops";

  evaluate(context: RuleContext): RuleResult {
    const { fromElement, toElement, appState } = context;

    if (!fromElement || !toElement || !appState) {
      return { allowed: true, ruleName: this.name };
    }

    if (this.wouldCreateCycle(fromElement, toElement, appState)) {
      return {
        allowed: false,
        message: `Cannot connect ${fromElement.text || fromElement.type} to ${
          toElement.text || toElement.type
        }: would create a loop`,
        ruleName: this.name,
      };
    }

    return { allowed: true, ruleName: this.name };
  }

  private wouldCreateCycle(
    from: AppElement,
    to: AppElement,
    appState: AppState
  ): boolean {
    // DFS
    const visited = new Set<string>();

    const hasPath = (start: AppElement, target: AppElement): boolean => {
      if (start.id === target.id) return true;
      if (visited.has(start.id)) return false;

      visited.add(start.id);

      const outgoingConnections = appState.connections.filter(
        (conn) => conn.from.id === start.id
      );

      for (const conn of outgoingConnections) {
        if (hasPath(conn.to, target)) {
          return true;
        }
      }

      return false;
    };

    return hasPath(to, from);
  }
}

class IOCompatibilityRule implements Rule {
  name = "I/O Compatibility";
  description = "Prevents incompatible input/output connections";

  evaluate(context: RuleContext): RuleResult {
    const { fromElement, toElement } = context;

    if (!fromElement || !toElement) {
      return { allowed: true, ruleName: this.name };
    }

    if (fromElement.type === "input" && toElement.type === "input") {
      return {
        allowed: false,
        message: `Cannot connect Input to Input: ${
          fromElement.text || "Input"
        } → ${toElement.text || "Input"}`,
        ruleName: this.name,
      };
    }

    if (fromElement.type === "output" && toElement.type === "output") {
      return {
        allowed: false,
        message: `Cannot connect Output to Output: ${
          fromElement.text || "Output"
        } → ${toElement.text || "Output"}`,
        ruleName: this.name,
      };
    }

    return { allowed: true, ruleName: this.name };
  }
}

class DepthMatchRule implements Rule {
  name = "Depth Matching";
  description =
    "Connections should be between elements at compatible nesting levels";

  evaluate(context: RuleContext): RuleResult {
    const { fromElement, toElement } = context;

    if (!fromElement || !toElement) {
      return { allowed: true, ruleName: this.name };
    }

    const fromDepth = this.getElementDepth(fromElement);
    const toDepth = this.getElementDepth(toElement);

    const depthDiff = Math.abs(fromDepth - toDepth);

    if (depthDiff > 1) {
      return {
        allowed: false,
        message: `Cannot connect elements with depth difference > 1: ${
          fromElement.text || fromElement.type
        } (depth ${fromDepth}) → ${
          toElement.text || toElement.type
        } (depth ${toDepth})`,
        ruleName: this.name,
      };
    }

    return { allowed: true, ruleName: this.name };
  }

  private getElementDepth(element: AppElement): number {
    let depth = 0;
    let current = element.parent;

    while (current) {
      depth++;
      current = current.parent;
    }

    return depth;
  }
}

export class RuleFeedback {
  private popup: HTMLElement | null = null;

  constructor() {
    this.createPopup();
  }

  private createPopup() {
    this.popup = document.createElement("div");
    this.popup.id = "ruleFeedbackPopup";
    this.popup.className = "rule-feedback-popup hidden";
    this.popup.innerHTML = `
      <div class="rule-feedback-content">
        <div class="rule-feedback-header">
          <span class="rule-feedback-title">Action Blocked</span>
          <button class="rule-feedback-close">&times;</button>
        </div>
        <div class="rule-feedback-body">
          <div class="rule-feedback-message"></div>
          <div class="rule-feedback-rule"></div>
        </div>
      </div>
    `;

    const style = document.createElement("style");
    style.textContent = `
      .rule-feedback-popup {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #ffffff;
        border: 2px solid #e74c3c;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 1000;
        min-width: 300px;
        max-width: 500px;
      }

      .rule-feedback-popup.hidden {
        display: none;
      }

      .rule-feedback-content {
        padding: 0;
      }

      .rule-feedback-header {
        background: #e74c3c;
        color: white;
        padding: 12px 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-radius: 6px 6px 0 0;
      }

      .rule-feedback-title {
        font-weight: bold;
        font-size: 16px;
      }

      .rule-feedback-close {
        background: none;
        border: none;
        color: white;
        font-size: 20px;
        cursor: pointer;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .rule-feedback-close:hover {
        background: rgba(255, 255, 255, 0.2);
        border-radius: 4px;
      }

      .rule-feedback-body {
        padding: 16px;
      }

      .rule-feedback-message {
        margin-bottom: 12px;
        font-size: 14px;
        line-height: 1.4;
        color: #333;
      }

      .rule-feedback-rule {
        font-size: 12px;
        color: #666;
        font-style: italic;
      }

      .rule-feedback-rule::before {
        content: "Rule: ";
        font-weight: bold;
      }
    `;

    document.head.appendChild(style);
    document.body.appendChild(this.popup);

    const closeBtn = this.popup.querySelector(".rule-feedback-close");
    closeBtn?.addEventListener("click", () => this.hide());

    this.popup.addEventListener("click", (e) => {
      if (e.target === this.popup) {
        this.hide();
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !this.popup?.classList.contains("hidden")) {
        this.hide();
      }
    });
  }

  show(ruleResult: RuleResult) {
    if (!this.popup) return;

    const messageEl = this.popup.querySelector(".rule-feedback-message");
    const ruleEl = this.popup.querySelector(".rule-feedback-rule");

    if (messageEl)
      messageEl.textContent = ruleResult.message || "Action not allowed";
    if (ruleEl) ruleEl.textContent = ruleResult.ruleName;

    this.popup.classList.remove("hidden");

    setTimeout(() => {
      this.hide();
    }, 5000);
  }

  hide() {
    if (this.popup) {
      this.popup.classList.add("hidden");
    }
  }
}
