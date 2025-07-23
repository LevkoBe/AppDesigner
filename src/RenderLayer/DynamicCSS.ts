const STATE_COLORS = {
  selected: "#e9ff42",
  "has-parent": "#fb923c",
  "has-children": "#4ade80",
  "is-anchored": "#a855f7",
  "is-active": "#3b82f6",
} as const;

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

function getBlurAmount(stateCount: number): number {
  return Math.max(3, 9 - stateCount);
}

export function updateElementState(element: HTMLElement): void {
  const activeStates: StateKey[] = [];

  Object.keys(STATE_COLORS).forEach((state) => {
    if (element.classList.contains(state)) {
      activeStates.push(state as StateKey);
    }
  });

  const gradient = generateConicGradient(activeStates);
  const blur = getBlurAmount(activeStates.length);

  element.style.setProperty("--element-gradient", gradient);
  element.style.setProperty("--element-blur", `${blur}px`);
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

export const ELEMENT_STATES_CSS = `
:root {
  --color-yellow: #e9ff42;
  --color-green: #4ade80;
  --color-orange: #fb923c;
  --color-light-gray: #e5e7eb;
  --color-purple: #a855f7;
  --color-blue: #3b82f6;
  --color-gray-90: 229, 231, 235;
  --color-gray-120: 156, 163, 175;
  --rgb-collection-border-base: 59, 130, 246;
  --rgb-function-border-base: 168, 85, 247;
  --rgb-orange: 251, 146, 60;
  --rgb-green: 74, 222, 128;
}

.element {
  position: absolute;
  backdrop-filter: blur(8px);
  --element-gradient: radial-gradient(circle, rgba(156, 163, 175, 0.3) 0%, transparent 100%);
  --element-blur: 8px;
}

.element::before {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: 75%;
  height: 75%;
  transform: translate(-50%, -50%);
  background: var(--element-gradient);
  filter: blur(var(--element-blur));
  z-index: 0;
  pointer-events: none;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.element:hover {
  transform: translateY(-4px) scale(1.03);
}

.element.selected .element-svg path {
  stroke: var(--color-yellow);
}

.element.connection-source {
  border-color: var(--color-green);
}

.element.connection-source .element-svg {
  stroke: var(--color-green);
}

.element.dragging {
  opacity: 0.8;
  transform: scale(1.05);
  z-index: 10;
}

.collection {
  border-radius: 15px;
  border-color: rgba(var(--rgb-collection-border-base), 0.8);
}

.function {
  border-radius: 50%;
  border-color: rgba(var(--rgb-function-border-base), 0.8);
}

.object {
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: visible;
}

.input,
.output {
  border-radius: 25px;
  font-size: 11px;
  border-color: rgba(var(--rgb-green), 0.9);
}

.element .element-svg {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  stroke: rgba(var(--color-gray-90), 0.8);
  stroke-width: 15px;
  box-sizing: border-box;
}

.element .element-svg path {
  fill: none;
  stroke: var(--color-light-gray);
  stroke-width: 15px;
  transition: stroke 0.3s ease;
}

.object .element-text,
.object .element-input {
  z-index: 2;
  position: relative;
}

.element-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  padding: 0 5px;
  box-sizing: border-box;
  user-select: none;
}

.element-input {
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid #444;
  border-radius: 4px;
  outline: none;
  color: #eee;
  font: inherit;
  text-align: center;
  width: calc(100% - 10px);
  padding: 2px 5px;
  box-sizing: border-box;
  text-shadow: 0 0 3px rgba(0, 0, 0, 0.7);
  display: none;
}
`;
