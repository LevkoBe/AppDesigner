import { vi, describe, beforeEach, test, expect } from "vitest";
import { AppElement } from "../../src/_models/AppElement";
import { InputState } from "../../src/InputLayer/InputState";
import { AppState } from "../../src/LogicLayer/AppState";
import { LogicLayer } from "../../src/LogicLayer/LogicLayer";

vi.mock("../LogicLayer/utils/ForceDirectedLayout");
vi.mock("../LogicLayer/utils/ProjectManager");
vi.mock("../LogicLayer/utils/RuleEngine");
vi.mock("../RenderLayer/RuleFeedback");

describe("LogicLayer", () => {
  let logicLayer: LogicLayer;
  let inputState: InputState;
  let appState: AppState;
  let mockCanvas: HTMLCanvasElement;

  beforeEach(() => {
    inputState = new InputState();
    appState = new AppState();
    mockCanvas = document.createElement("canvas");
    logicLayer = new LogicLayer(inputState, appState, mockCanvas);
  });

  describe("processInput", () => {
    test("should handle create action", () => {
      inputState.setAction("create");
      inputState.mousePosition = { x: 100, y: 200 };
      inputState.elementType = "object";

      const initialElementCount = appState.elements.length;
      logicLayer.processInput();

      expect(appState.elements.length).toBe(initialElementCount + 1);
      expect(appState.selectedElement).toBeDefined();
    });

    test("should handle select action", () => {
      const element = new AppElement("object", 100, 200);
      appState.addElement(element);
      inputState.setAction("select");
      inputState.activeId = element.id;

      logicLayer.processInput();

      expect(appState.selectedElement).toBe(element);
    });

    test("should handle delete action", () => {
      const element = new AppElement("object", 100, 200);
      appState.addElement(element);
      inputState.setAction("delete");
      inputState.activeId = element.id;

      logicLayer.processInput();

      expect(appState.elements).not.toContain(element);
      expect(appState.selectedElement).toBeUndefined();
    });

    test("should handle move action", () => {
      const element = new AppElement("object", 100, 200);
      appState.addElement(element);
      inputState.setAction("move");
      inputState.secondaryId = element.id;
      inputState.mousePosition = { x: 300, y: 400 };

      logicLayer.processInput();

      expect(element.x).toBe(300);
      expect(element.y).toBe(400);
    });

    test("should handle connect action", () => {
      const element1 = new AppElement("object", 100, 200);
      const element2 = new AppElement("function", 300, 400);
      appState.addElement(element1);
      appState.addElement(element2);

      inputState.setAction("connect");
      inputState.activeId = element2.id;
      inputState.secondaryId = element1.id;

      const initialConnectionCount = appState.connections.length;
      logicLayer.processInput();

      expect(appState.connections.length).toBe(initialConnectionCount + 1);
    });

    test("should handle edit action", () => {
      const element = new AppElement("object", 100, 200);
      appState.addElement(element);
      inputState.setAction("edit");
      inputState.activeId = element.id;
      inputState.text = "New Text";

      logicLayer.processInput();

      expect(appState.editingElement).toBe(element);
      expect(element.text).toBe("New Text");
    });

    test("should handle anchor action", () => {
      const element = new AppElement("object", 100, 200);
      appState.addElement(element);
      inputState.setAction("anchor");
      inputState.activeId = element.id;

      const initialAnchorState = element.isAnchored;
      logicLayer.processInput();

      expect(element.isAnchored).toBe(!initialAnchorState);
    });

    test("should handle zoom actions", () => {
      inputState.setAction("zoomIn");
      inputState.zoom = 1.5;
      inputState.pan = { x: 50, y: 75 };

      logicLayer.processInput();

      expect(appState.zoom).toBe(1.5);
      expect(appState.pan).toEqual({ x: 50, y: 75 });
    });

    test("should handle mode change", () => {
      inputState.setAction("changeMode");
      inputState.currentMode = "edit";

      logicLayer.processInput();

      expect(appState.currentMode).toBe("edit");
    });

    test("should handle layout toggle", () => {
      const initialAutoLayout = appState.autoLayout;
      inputState.setAction("layout");

      logicLayer.processInput();

      expect(appState.autoLayout).toBe(!initialAutoLayout);
    });

    test("should handle clear action", () => {
      const element = new AppElement("object", 100, 200);
      appState.addElement(element);
      inputState.setAction("clear");

      logicLayer.processInput();

      expect(appState.elements).toEqual([]);
      expect(appState.connections).toEqual([]);
    });
  });
});
