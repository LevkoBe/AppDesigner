import { describe, test, expect, beforeEach } from "vitest";
import { InputState } from "../../src/InputLayer/InputState";
import { AppElement } from "../../src/_models/AppElement";
import { Action, ElementType, Mode } from "../../src/types";

describe("InputState", () => {
  let inputState: InputState;

  beforeEach(() => {
    inputState = new InputState();
  });

  describe("constructor and initial state", () => {
    test("should initialize with default values", () => {
      expect(inputState.action).toBe("none");
      expect(inputState.elementType).toBe("object");
      expect(inputState.currentMode).toBe("create");
      expect(inputState.shiftKey).toBe(false);
      expect(inputState.mousePosition).toBeUndefined();
      expect(inputState.text).toBeUndefined();
      expect(inputState.isEditing).toBe(false);
      expect(inputState.dragOffset).toBeUndefined();
      expect(inputState.activeId).toBeUndefined();
      expect(inputState.secondaryId).toBeUndefined();
      expect(inputState.zoom).toBe(1);
      expect(inputState.pan).toEqual({ x: 0, y: 0 });
    });
  });

  describe("updateActiveId", () => {
    test("should set activeId when no previous activeId exists", () => {
      inputState.updateActiveId("element-1");
      expect(inputState.activeId).toBe("element-1");
      expect(inputState.secondaryId).toBeUndefined();
    });

    test("should move current activeId to secondaryId when setting new activeId", () => {
      inputState.updateActiveId("element-1");
      inputState.updateActiveId("element-2");

      expect(inputState.activeId).toBe("element-2");
      expect(inputState.secondaryId).toBe("element-1");
    });

    test("should not change secondaryId when setting same activeId", () => {
      inputState.updateActiveId("element-1");
      inputState.secondaryId = "element-2";
      inputState.updateActiveId("element-1");

      expect(inputState.activeId).toBe("element-1");
      expect(inputState.secondaryId).toBe("element-2");
    });

    test("should handle undefined elementId", () => {
      inputState.updateActiveId("element-1");
      inputState.updateActiveId(undefined);

      expect(inputState.activeId).toBeUndefined();
      expect(inputState.secondaryId).toBe("element-1");
    });
  });

  describe("executeAction", () => {
    test("should execute edit action and set editing state", () => {
      inputState.executeAction("edit", "test text");

      expect(inputState.action).toBe("edit");
      expect(inputState.text).toBe("test text");
      expect(inputState.isEditing).toBe(true);
    });

    test("should execute edit action without text", () => {
      inputState.executeAction("edit");

      expect(inputState.action).toBe("edit");
      expect(inputState.text).toBeUndefined();
      expect(inputState.isEditing).toBe(true);
    });

    test("should execute connect action", () => {
      inputState.secondaryId = "element-1";
      inputState.activeId = "element-2";
      inputState.executeAction("connect");

      expect(inputState.action).toBe("connect");
      expect(inputState.isEditing).toBe(false);
      expect(inputState.text).toBeUndefined();
      expect(inputState.secondaryId).toBeDefined();
    });
    test("should not execute connect action", () => {
      inputState.executeAction("connect");

      expect(inputState.action).toBe("select");
      expect(inputState.isEditing).toBe(false);
      expect(inputState.text).toBeUndefined();
      expect(inputState.secondaryId).toBeUndefined();
    });

    test("should execute zoomIn action", () => {
      const initialZoom = inputState.zoom;
      inputState.executeAction("zoomIn");

      expect(inputState.action).toBe("zoomIn");
      expect(inputState.zoom).toBeCloseTo(initialZoom * 1.2);
    });

    test("should execute zoomOut action", () => {
      inputState.zoom = 2.4;
      inputState.executeAction("zoomOut");

      expect(inputState.action).toBe("zoomOut");
      expect(inputState.zoom).toBeCloseTo(2);
    });

    test("should execute zoomReset action", () => {
      inputState.zoom = 2;
      inputState.pan = { x: 100, y: 200 };
      inputState.executeAction("zoomReset");

      expect(inputState.action).toBe("zoomReset");
      expect(inputState.zoom).toBe(1);
      expect(inputState.pan).toEqual({ x: 0, y: 0 });
    });

    test("should execute non-special actions and reset editing state", () => {
      inputState.isEditing = true;
      inputState.text = "old text";
      inputState.secondaryId = "old-secondary";

      inputState.executeAction("create");

      expect(inputState.action).toBe("create");
      expect(inputState.isEditing).toBe(false);
      expect(inputState.text).toBeUndefined();
      expect(inputState.secondaryId).toBeUndefined();
    });

    test("should handle all action types", () => {
      const actions = [
        "none",
        "create",
        "select",
        "move",
        "delete",
        "anchor",
        "export",
        "import",
        "menu",
        "mode",
      ];

      actions.forEach((action) => {
        inputState.executeAction(action as Action);
        expect(inputState.action).toBe(action);
      });
    });
  });

  describe("mouse event handlers", () => {
    describe("onMouseDown", () => {
      test("should set mouse position and update activeId", () => {
        const element: AppElement = {
          id: "element-1",
          x: 100,
          y: 200,
          width: 50,
          height: 30,
        } as AppElement;

        inputState.onMouseDown(150, 250, element);

        expect(inputState.mousePosition).toEqual({ x: 150, y: 250 });
        expect(inputState.activeId).toBe("element-1");
      });

      test("should set drag offset in move mode", () => {
        const element: AppElement = {
          id: "element-1",
          x: 100,
          y: 200,
          width: 50,
          height: 30,
        } as AppElement;
        inputState.currentMode = "move";

        inputState.onMouseDown(120, 180, element);

        expect(inputState.dragOffset).toEqual({ x: 20, y: -20 });
      });

      test("should not set drag offset when not in move mode", () => {
        const element: AppElement = {
          id: "element-1",
          x: 100,
          y: 200,
          width: 50,
          height: 30,
        } as AppElement;
        inputState.currentMode = "create";

        inputState.onMouseDown(120, 180, element);

        expect(inputState.dragOffset).toBeUndefined();
      });

      test("should handle no element", () => {
        inputState.onMouseDown(150, 250);

        expect(inputState.mousePosition).toEqual({ x: 150, y: 250 });
        expect(inputState.activeId).toBeUndefined();
        expect(inputState.dragOffset).toBeUndefined();
      });
    });

    describe("onMouseUp", () => {
      test("should clear drag offset", () => {
        inputState.dragOffset = { x: 10, y: 20 };

        inputState.onMouseUp();

        expect(inputState.dragOffset).toBeUndefined();
      });
    });

    describe("onClick", () => {
      test("should set mouse position, update activeId, and execute mode as action", () => {
        inputState.currentMode = "create";

        inputState.onClick(100, 200, "element-1");

        expect(inputState.mousePosition).toEqual({ x: 100, y: 200 });
        expect(inputState.activeId).toBe("element-1");
        expect(inputState.action).toBe("create");
      });

      test("should handle click without element", () => {
        inputState.currentMode = "move";

        inputState.onClick(100, 200);

        expect(inputState.mousePosition).toEqual({ x: 100, y: 200 });
        expect(inputState.activeId).toBeUndefined();
        expect(inputState.action).toBe("move");
      });
    });

    describe("onDoubleClick", () => {
      test("should execute edit action when elementId provided", () => {
        inputState.onDoubleClick(100, 200, "element-1");

        expect(inputState.mousePosition).toEqual({ x: 100, y: 200 });
        expect(inputState.activeId).toBe("element-1");
        expect(inputState.action).toBe("edit");
        expect(inputState.isEditing).toBe(true);
      });

      test("should not execute edit action when no elementId provided", () => {
        const initialAction = inputState.action;

        inputState.onDoubleClick(100, 200);

        expect(inputState.action).toBe(initialAction);
        expect(inputState.isEditing).toBe(false);
      });
    });

    describe("onDrag", () => {
      test("should handle drag in move mode with drag offset", () => {
        inputState.currentMode = "move";
        inputState.dragOffset = { x: 10, y: 20 };

        inputState.onDrag("element-1", 150, 250);

        expect(inputState.activeId).toBe("element-1");
        expect(inputState.mousePosition).toEqual({ x: 140, y: 230 });
        expect(inputState.action).toBe("move");
      });

      test("should not handle drag when not in move mode", () => {
        inputState.currentMode = "create";
        inputState.dragOffset = { x: 10, y: 20 };
        const initialAction = inputState.action;

        inputState.onDrag("element-1", 150, 250);

        expect(inputState.action).toBe(initialAction);
      });

      test("should not handle drag when no drag offset", () => {
        inputState.currentMode = "move";
        const initialAction = inputState.action;

        inputState.onDrag("element-1", 150, 250);

        expect(inputState.action).toBe(initialAction);
      });
    });

    describe("onContextMenu", () => {
      test("should execute menu action when elementId provided", () => {
        inputState.onContextMenu(100, 200, "element-1");

        expect(inputState.mousePosition).toEqual({ x: 100, y: 200 });
        expect(inputState.activeId).toBe("element-1");
        expect(inputState.action).toBe("menu");
      });

      test("should not execute menu action when no elementId provided", () => {
        const initialAction = inputState.action;

        inputState.onContextMenu(100, 200);

        expect(inputState.action).toBe(initialAction);
      });
    });
  });

  describe("mode and element type setters", () => {
    describe("setMode", () => {
      test("should update current mode and execute mode action", () => {
        inputState.setMode("edit");

        expect(inputState.currentMode).toBe("edit");
        expect(inputState.action).toBe("mode");
      });

      test("should handle all mode types", () => {
        const modes = ["create", "move", "edit", "connect"];

        modes.forEach((mode) => {
          inputState.setMode(mode as Mode);
          expect(inputState.currentMode).toBe(mode);
          expect(inputState.action).toBe("mode");
        });
      });
    });

    describe("setElementType", () => {
      test("should update element type and execute select action", () => {
        inputState.setElementType("collection");

        expect(inputState.elementType).toBe("collection");
        expect(inputState.action).toBe("select");
      });

      test("should handle all element types", () => {
        const types = ["object", "connection", "note"];

        types.forEach((type) => {
          inputState.setElementType(type as ElementType);
          expect(inputState.elementType).toBe(type);
          expect(inputState.action).toBe("select");
        });
      });
    });
  });

  describe("validateAction", () => {
    test("should return connect when valid connection exists", () => {
      inputState.activeId = "element-1";
      inputState.secondaryId = "element-2";
      inputState.shiftKey = false;

      const result = inputState.validateAction("connect");

      expect(result).toBe("connect");
    });

    test("should return disconnect when valid connection exists and shift key pressed", () => {
      inputState.activeId = "element-1";
      inputState.secondaryId = "element-2";
      inputState.shiftKey = true;

      const result = inputState.validateAction("connect");

      expect(result).toBe("disconnect");
    });

    test("should return select when no activeId for connect", () => {
      inputState.secondaryId = "element-2";

      const result = inputState.validateAction("connect");

      expect(result).toBe("select");
    });

    test("should return select when no secondaryId for connect", () => {
      inputState.activeId = "element-1";

      const result = inputState.validateAction("connect");

      expect(result).toBe("select");
    });

    test("should return select when activeId equals secondaryId for connect", () => {
      inputState.activeId = "element-1";
      inputState.secondaryId = "element-1";

      const result = inputState.validateAction("connect");

      expect(result).toBe("select");
    });

    test("should handle duplicate action", () => {
      inputState.activeId = "element-1";

      const result = inputState.validateAction("duplicate");

      expect(result).toBe("create");
      expect(inputState.activeId).toBeUndefined();
    });

    test("should return same action for non-special actions", () => {
      const actions = ["create", "select", "move", "delete", "edit", "anchor"];

      actions.forEach((action) => {
        const result = inputState.validateAction(action as Action);
        expect(result).toBe(action);
      });
    });
  });

  describe("clear", () => {
    test("should reset action to none", () => {
      inputState.executeAction("create");

      inputState.clear();

      expect(inputState.action).toBe("none");
    });

    test("should only clear action, not other state", () => {
      inputState.executeAction("edit", "test");
      inputState.activeId = "element-1";
      inputState.zoom = 2;

      inputState.clear();

      expect(inputState.action).toBe("none");
      expect(inputState.isEditing).toBe(true);
      expect(inputState.text).toBe("test");
      expect(inputState.activeId).toBe("element-1");
      expect(inputState.zoom).toBe(2);
    });
  });

  describe("integrated workflows", () => {
    test("should handle complete element creation workflow", () => {
      inputState.setMode("create");
      expect(inputState.currentMode).toBe("create");
      expect(inputState.action).toBe("mode");

      inputState.setElementType("function");
      expect(inputState.elementType).toBe("function");
      expect(inputState.action).toBe("select");

      inputState.onClick(100, 200);
      expect(inputState.mousePosition).toEqual({ x: 100, y: 200 });
      expect(inputState.action).toBe("create");
    });

    test("should handle complete connection workflow", () => {
      inputState.setMode("connect");

      inputState.onClick(100, 200, "element-1");
      expect(inputState.activeId).toBe("element-1");

      inputState.onClick(150, 250, "element-2");
      expect(inputState.activeId).toBe("element-2");
      expect(inputState.secondaryId).toBe("element-1");

      expect(inputState.action).toBe("connect");
    });

    test("should handle complete edit workflow", () => {
      inputState.onDoubleClick(100, 200, "element-1");
      expect(inputState.isEditing).toBe(true);
      expect(inputState.action).toBe("edit");

      inputState.executeAction("edit", "new text");
      expect(inputState.text).toBe("new text");
      expect(inputState.isEditing).toBe(true);

      inputState.executeAction("select");
      expect(inputState.isEditing).toBe(false);
      expect(inputState.text).toBeUndefined();
    });

    test("should handle complete move workflow", () => {
      const element: AppElement = {
        id: "element-1",
        x: 100,
        y: 200,
        width: 50,
        height: 30,
      } as AppElement;

      inputState.setMode("move");

      inputState.onMouseDown(120, 180, element);
      expect(inputState.dragOffset).toEqual({ x: 20, y: -20 });

      inputState.onDrag("element-1", 150, 250);
      expect(inputState.mousePosition).toEqual({ x: 130, y: 270 });
      expect(inputState.action).toBe("move");

      inputState.onMouseUp();
      expect(inputState.dragOffset).toBeUndefined();
    });

    test("should handle zoom workflow", () => {
      inputState.executeAction("zoomIn");
      inputState.executeAction("zoomIn");
      expect(inputState.zoom).toBeCloseTo(1.44);

      inputState.executeAction("zoomOut");
      expect(inputState.zoom).toBeCloseTo(1.2);

      inputState.pan = { x: 50, y: 100 };
      inputState.executeAction("zoomReset");
      expect(inputState.zoom).toBe(1);
      expect(inputState.pan).toEqual({ x: 0, y: 0 });
    });
  });

  describe("edge cases and error conditions", () => {
    test("should handle rapid mode changes", () => {
      inputState.setMode("create");
      inputState.setMode("move");
      inputState.setMode("edit");

      expect(inputState.currentMode).toBe("edit");
      expect(inputState.action).toBe("mode");
    });

    test("should handle multiple activeId updates", () => {
      inputState.updateActiveId("element-1");
      inputState.updateActiveId("element-2");
      inputState.updateActiveId("element-3");

      expect(inputState.activeId).toBe("element-3");
      expect(inputState.secondaryId).toBe("element-2");
    });

    test("should handle extreme zoom values", () => {
      for (let i = 0; i < 10; i++) {
        inputState.executeAction("zoomIn");
      }
      expect(inputState.zoom).toBeGreaterThan(6);

      for (let i = 0; i < 20; i++) {
        inputState.executeAction("zoomOut");
      }
      expect(inputState.zoom).toBeLessThan(0.2);
    });

    test("should handle drag without proper setup", () => {
      const initialAction = inputState.action;
      inputState.onDrag("element-1", 100, 200);

      expect(inputState.action).toBe(initialAction);
    });

    test("should handle connect validation edge cases", () => {
      expect(inputState.validateAction("connect")).toBe("select");

      inputState.activeId = "element-1";
      expect(inputState.validateAction("connect")).toBe("select");

      inputState.activeId = undefined;
      inputState.secondaryId = "element-1";
      expect(inputState.validateAction("connect")).toBe("select");

      inputState.activeId = "element-1";
      inputState.secondaryId = "element-1";
      expect(inputState.validateAction("connect")).toBe("select");
    });
  });
});
