import { describe, test, expect, beforeEach } from "vitest";
import { InputState } from "../../src/InputLayer/InputState";

describe("InputState", () => {
  let inputState: InputState;

  beforeEach(() => {
    inputState = new InputState();
  });

  describe("constructor", () => {
    test("should initialize with default values", () => {
      expect(inputState.getAction).toBe("none");
      expect(inputState.elementType).toBe("object");
      expect(inputState.currentMode).toBe("create");
      expect(inputState.shiftKey).toBe(false);
      expect(inputState.isEditing).toBe(false);
      expect(inputState.zoom).toBe(1);
      expect(inputState.pan).toEqual({ x: 0, y: 0 });
    });
  });

  describe("setAction", () => {
    test("should set action and update editing state for edit action", () => {
      inputState.setAction("edit");
      expect(inputState.getAction).toBe("edit");
      expect(inputState.isEditing).toBe(true);
    });

    test("should clear editing state and text for non-edit actions", () => {
      inputState.text = "test";
      inputState.isEditing = true;
      inputState.setAction("create");

      expect(inputState.getAction).toBe("create");
      expect(inputState.isEditing).toBe(false);
      expect(inputState.text).toBeUndefined();
    });

    test("should clear secondaryId for non-connect actions", () => {
      inputState.secondaryId = "test-id";
      inputState.setAction("select");

      expect(inputState.secondaryId).toBeUndefined();
    });

    test("should preserve secondaryId for connect action", () => {
      inputState.secondaryId = "test-id";
      inputState.setAction("connect");

      expect(inputState.secondaryId).toBe("test-id");
    });
  });

  describe("clear", () => {
    test("should reset action to none", () => {
      inputState.setAction("create");
      inputState.clear();
      expect(inputState.getAction).toBe("none");
    });
  });

  describe("interpretClick", () => {
    test("should handle create mode click without element", () => {
      inputState.currentMode = "create";
      inputState.interpretClick(100, 200);

      expect(inputState.getAction).toBe("create");
      expect(inputState.mousePosition).toEqual({ x: 100, y: 200 });
      expect(inputState.activeId).toBeUndefined();
    });

    test("should handle create mode click with shift key for delete", () => {
      inputState.currentMode = "create";
      inputState.interpretClick(100, 200, "element-1", true);

      expect(inputState.getAction).toBe("delete");
      expect(inputState.activeId).toBe("element-1");
      expect(inputState.shiftKey).toBe(true);
    });

    test("should handle connect mode with valid connection", () => {
      inputState.currentMode = "connect";
      inputState.activeId = "element-1";
      inputState.interpretClick(100, 200, "element-2");

      expect(inputState.getAction).toBe("connect");
      expect(inputState.secondaryId).toBe("element-1");
      expect(inputState.activeId).toBe("element-2");
    });

    test("should handle edit mode click", () => {
      inputState.currentMode = "edit";
      inputState.interpretClick(100, 200, "element-1");

      expect(inputState.getAction).toBe("edit");
      expect(inputState.activeId).toBe("element-1");
    });

    test("should handle move mode click", () => {
      inputState.currentMode = "move";
      inputState.interpretClick(100, 200, "element-1");

      expect(inputState.getAction).toBe("select");
      expect(inputState.activeId).toBe("element-1");
    });
  });

  describe("resetConnectionState", () => {
    test("should clear secondaryId", () => {
      inputState.secondaryId = "test-id";
      inputState.resetConnectionState();
      expect(inputState.secondaryId).toBeUndefined();
    });

    test("should reset connect mode state", () => {
      inputState.currentMode = "connect";
      inputState.activeId = "test-id";
      inputState.setAction("connect");

      inputState.resetConnectionState();

      expect(inputState.activeId).toBeUndefined();
      expect(inputState.getAction).toBe("none");
    });
  });

  describe("interpretModeChange", () => {
    test("should update current mode and set changeMode action", () => {
      inputState.interpretModeChange("edit");

      expect(inputState.currentMode).toBe("edit");
      expect(inputState.getAction).toBe("changeMode");
    });
  });

  describe("interpretDrag", () => {
    test("should handle drag in move mode", () => {
      inputState.currentMode = "move";
      inputState.dragOffset = { x: 10, y: 20 };

      inputState.interpretDrag("element-1", 150, 250);

      expect(inputState.getAction).toBe("move");
      expect(inputState.secondaryId).toBe("element-1");
      expect(inputState.mousePosition).toEqual({ x: 140, y: 230 });
    });

    test("should not handle drag without dragOffset", () => {
      inputState.currentMode = "move";
      inputState.interpretDrag("element-1", 150, 250);

      expect(inputState.getAction).toBe("none");
    });
  });

  describe("interpretControlsAction", () => {
    test("should handle zoomIn action", () => {
      inputState.interpretControlsAction("zoomIn");

      expect(inputState.getAction).toBe("zoomIn");
      expect(inputState.zoom).toBeCloseTo(1.2);
    });

    test("should handle zoomOut action", () => {
      inputState.interpretControlsAction("zoomOut");

      expect(inputState.getAction).toBe("zoomOut");
      expect(inputState.zoom).toBeCloseTo(1 / 1.2);
    });

    test("should handle resetView action", () => {
      inputState.zoom = 2;
      inputState.pan = { x: 100, y: 200 };

      inputState.interpretControlsAction("resetView");

      expect(inputState.getAction).toBe("resetView");
      expect(inputState.zoom).toBe(1);
      expect(inputState.pan).toEqual({ x: 0, y: 0 });
    });
  });

  describe("interpretTextEdit", () => {
    test("should set edit action and update text", () => {
      inputState.interpretTextEdit("element-1", "new text");

      expect(inputState.getAction).toBe("edit");
      expect(inputState.activeId).toBe("element-1");
      expect(inputState.text).toBe("new text");
    });
  });
});
