import { vi } from "vitest";

Object.defineProperty(window, "innerWidth", { value: 1024, writable: true });
Object.defineProperty(window, "innerHeight", { value: 768, writable: true });

HTMLCanvasElement.prototype.getContext = vi.fn((contextId: string) => {
  if (contextId === "2d") {
    return {
      fillRect: vi.fn(),
      clearRect: vi.fn(),
      getImageData: vi.fn(() => ({ data: new Array(4) })),
      putImageData: vi.fn(),
      createImageData: vi.fn(() => ({ data: new Array(4) })),
      setTransform: vi.fn(),
      drawImage: vi.fn(),
      save: vi.fn(),
      fillText: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      closePath: vi.fn(),
      stroke: vi.fn(),
      translate: vi.fn(),
      scale: vi.fn(),
      rotate: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      measureText: vi.fn(() => ({ width: 100 })),
      transform: vi.fn(),
      rect: vi.fn(),
      clip: vi.fn(),

      canvas: document.createElement("canvas"),
      globalAlpha: 1.0,
      globalCompositeOperation: "source-over",
      isPointInPath: vi.fn(() => false),
      isPointInStroke: vi.fn(() => false),
    } as unknown as CanvasRenderingContext2D;
  }

  return null;
}) as unknown as HTMLCanvasElement["getContext"];

Element.prototype.getBoundingClientRect = vi.fn(() => ({
  bottom: 0,
  height: 0,
  left: 0,
  right: 0,
  top: 0,
  width: 0,
  x: 0,
  y: 0,
  toJSON: () => ({}),
}));
