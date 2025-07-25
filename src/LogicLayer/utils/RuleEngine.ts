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
