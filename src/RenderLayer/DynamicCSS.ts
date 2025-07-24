import { ElementState, CSSColorVar } from "../types";

const STATE_COLORS: Record<ElementState, CSSColorVar> = {
  selected: "var(--color-yellow)",
  child: "var(--color-orange)",
  parent: "var(--color-green)",
  anchored: "var(--color-purple)",
  active: "var(--color-blue)",
};

type StateKey = keyof typeof STATE_COLORS;

function generateConicGradient(activeStates: StateKey[]): string {
  if (activeStates.length === 0) {
    return "radial-gradient(circle, rgba(156, 163, 175, 0.3) 0%, transparent 100%)";
  }

  if (activeStates.length === 1) {
    return `radial-gradient(circle, ${
      STATE_COLORS[activeStates[0]]
    } 0%, transparent 100%)`;
  }

  const sectorSize = 360 / activeStates.length;
  const gradientStops = activeStates
    .map((state, index) => {
      const startAngle = index * sectorSize;
      const endAngle = (index + 1) * sectorSize;
      return `${STATE_COLORS[state]} ${startAngle}deg ${endAngle}deg`;
    })
    .join(", ");

  return `conic-gradient(${gradientStops})`;
}

export function updateElementState(element: HTMLElement): void {
  const activeStates: StateKey[] = [];

  Object.keys(STATE_COLORS).forEach((state) => {
    if (element.classList.contains(state)) {
      activeStates.push(state as StateKey);
    }
  });

  const gradient = generateConicGradient(activeStates);

  element.style.setProperty("--element-gradient", gradient);
}

export function initializeStateObserver(): void {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (
        mutation.type === "attributes" &&
        mutation.attributeName === "class"
      ) {
        const element = mutation.target as HTMLElement;
        if (element.classList.contains("element")) {
          updateElementState(element);
        }
      }
    });
  });

  document.querySelectorAll(".element").forEach((element) => {
    observer.observe(element, { attributes: true, attributeFilter: ["class"] });
    updateElementState(element as HTMLElement);
  });

  const documentObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node instanceof HTMLElement && node.classList.contains("element")) {
          observer.observe(node, {
            attributes: true,
            attributeFilter: ["class"],
          });
          updateElementState(node);
        }
      });
    });
  });

  documentObserver.observe(document.body, { childList: true, subtree: true });
}
