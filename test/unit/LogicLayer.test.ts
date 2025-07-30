import { vi, describe, beforeEach, test, expect } from "vitest";
import { AppElement } from "../../src/_models/AppElement";
import { Connection } from "../../src/_models/Connection";
import { InputState } from "../../src/InputLayer/InputState";
import { AppState } from "../../src/LogicLayer/AppState";
import { LogicLayer } from "../../src/LogicLayer/LogicLayer";

const mockForceDirectedLayout = {
  stop: vi.fn(),
  start: vi.fn(),
};

const mockProjectManager = {
  saveProject: vi.fn(),
  loadProject: vi.fn(),
};

const mockRuleEngine = {
  evaluateElementCreation: vi.fn(),
  evaluateConnection: vi.fn(),
  getBlockingResult: vi.fn(),
};

const mockRuleFeedback = {
  show: vi.fn(),
  hide: vi.fn(),
};

vi.mock("../../src/LogicLayer/utils/ForceDirectedLayout", () => ({
  ForceDirectedLayout: vi
    .fn()
    .mockImplementation(() => mockForceDirectedLayout),
}));

vi.mock("../../src/LogicLayer/utils/ProjectManager", () => ({
  ProjectManager: vi.fn().mockImplementation(() => mockProjectManager),
}));

vi.mock("../../src/LogicLayer/utils/RuleEngine", () => ({
  RuleEngine: vi.fn().mockImplementation(() => mockRuleEngine),
}));

vi.mock("../../src/RenderLayer/RuleFeedback", () => ({
  RuleFeedback: vi.fn().mockImplementation(() => mockRuleFeedback),
}));

describe("LogicLayer", () => {
  let logicLayer: LogicLayer;
  let inputState: InputState;
  let appState: AppState;
  let mockCanvas: HTMLCanvasElement;

  beforeEach(() => {
    vi.clearAllMocks();
    inputState = new InputState();
    appState = new AppState();
    mockCanvas = document.createElement("canvas");
    logicLayer = new LogicLayer(inputState, appState, mockCanvas);

    mockRuleEngine.evaluateElementCreation.mockReturnValue([]);
    mockRuleEngine.evaluateConnection.mockReturnValue([]);
    mockRuleEngine.getBlockingResult.mockReturnValue(null);
  });

  describe("constructor", () => {
    test("should initialize with all dependencies", () => {
      expect(logicLayer).toBeInstanceOf(LogicLayer);
    });
  });

  describe("processInput - layout action", () => {
    test("should toggle layout on and start layout when enabled", () => {
      appState.layout = false;
      inputState.executeAction("layout");

      logicLayer.processInput();

      expect(appState.layout).toBe(true);
      expect(mockForceDirectedLayout.start).toHaveBeenCalledWith(
        appState.getRootElements(),
        appState.connections,
        []
      );
    });

    test("should toggle layout off and stop layout when disabled", () => {
      appState.layout = true;
      inputState.executeAction("layout");

      logicLayer.processInput();

      expect(appState.layout).toBe(false);
      expect(mockForceDirectedLayout.stop).toHaveBeenCalled();
    });
  });

  describe("processInput - create action", () => {
    test("should create element when no blocking rules", () => {
      inputState.executeAction("create");
      inputState.mousePosition = { x: 100, y: 200 };
      inputState.elementType = "object";
      const initialCount = appState.elements.length;

      logicLayer.processInput();

      expect(appState.elements.length).toBe(initialCount + 1);
      expect(appState.selectedElement).toBeDefined();
      expect(appState.selectedElement?.x).toBe(100);
      expect(appState.selectedElement?.y).toBe(200);
      expect(appState.selectedElement?.type).toBe("object");
      expect(appState.contextMenu).toBe(false);
    });

    test("should create child element when parent is selected", () => {
      const parent = new AppElement("object", 50, 50);
      appState.addElement(parent);

      inputState.executeAction("create");
      inputState.activeId = parent.id;
      inputState.mousePosition = { x: 100, y: 200 };
      inputState.elementType = "function";

      logicLayer.processInput();

      const createdElement = appState.selectedElement;
      expect(createdElement?.parent).toBe(parent);
      expect(parent.children).toContain(createdElement);
    });

    test("should not create element when blocking rule exists", () => {
      const blockingResult = {
        allowed: false,
        message: "Cannot create here",
        ruleName: "Test Rule",
      };
      mockRuleEngine.getBlockingResult.mockReturnValue(blockingResult);

      inputState.executeAction("create");
      inputState.mousePosition = { x: 100, y: 200 };
      const initialCount = appState.elements.length;

      logicLayer.processInput();

      expect(appState.elements.length).toBe(initialCount);
      expect(appState.selectedElement).toBeUndefined();
      expect(mockRuleFeedback.show).toHaveBeenCalledWith(blockingResult);
    });

    test("should not create element when no mouse position", () => {
      inputState.executeAction("create");
      inputState.mousePosition = undefined;
      const initialCount = appState.elements.length;

      logicLayer.processInput();

      expect(appState.elements.length).toBe(initialCount);
      expect(appState.selectedElement).toBeUndefined();
    });

    test("should restart layout if layout is enabled", () => {
      appState.layout = true;
      inputState.executeAction("create");
      inputState.mousePosition = { x: 100, y: 200 };

      logicLayer.processInput();

      expect(mockForceDirectedLayout.stop).toHaveBeenCalled();
      expect(mockForceDirectedLayout.start).toHaveBeenCalled();
    });
  });

  describe("processInput - move action", () => {
    test("should move element to new position", () => {
      const element = new AppElement("object", 100, 200);
      appState.addElement(element);

      inputState.executeAction("move");
      inputState.activeId = element.id;
      inputState.mousePosition = { x: 300, y: 400 };

      logicLayer.processInput();

      expect(element.x).toBe(300);
      expect(element.y).toBe(400);
    });

    test("should not move element when no activeId", () => {
      const element = new AppElement("object", 100, 200);
      appState.addElement(element);

      inputState.executeAction("move");
      inputState.mousePosition = { x: 300, y: 400 };

      logicLayer.processInput();

      expect(element.x).toBe(100);
      expect(element.y).toBe(200);
    });

    test("should not move element when no mouse position", () => {
      const element = new AppElement("object", 100, 200);
      appState.addElement(element);

      inputState.executeAction("move");
      inputState.activeId = element.id;
      inputState.mousePosition = undefined;

      logicLayer.processInput();

      expect(element.x).toBe(100);
      expect(element.y).toBe(200);
    });

    test("should restart layout if layout is enabled", () => {
      appState.layout = true;
      const element = new AppElement("object", 100, 200);
      appState.addElement(element);

      inputState.executeAction("move");
      inputState.activeId = element.id;
      inputState.mousePosition = { x: 300, y: 400 };

      logicLayer.processInput();

      expect(mockForceDirectedLayout.start).toHaveBeenCalled();
    });
  });

  describe("processInput - connect action", () => {
    test("should create connection when no blocking rules", () => {
      const element1 = new AppElement("object", 100, 200);
      const element2 = new AppElement("function", 300, 400);
      appState.addElement(element1);
      appState.addElement(element2);

      inputState.activeId = element2.id;
      inputState.secondaryId = element1.id;
      inputState.executeAction("connect");
      const initialCount = appState.connections.length;

      logicLayer.processInput();

      expect(appState.connections.length).toBe(initialCount + 1);
      expect(appState.connections[0].from).toBe(element1);
      expect(appState.connections[0].to).toBe(element2);
      expect(appState.selectedElement).toBe(element2);
      expect(appState.fromElement).toBeUndefined();
    });

    test("should not create duplicate connection", () => {
      const element1 = new AppElement("object", 100, 200);
      const element2 = new AppElement("function", 300, 400);
      appState.addElement(element1);
      appState.addElement(element2);

      const existingConnection = new Connection(element1, element2);
      appState.addConnection(existingConnection);

      inputState.activeId = element2.id;
      inputState.secondaryId = element1.id;
      inputState.executeAction("connect");
      const initialCount = appState.connections.length;

      logicLayer.processInput();

      expect(appState.connections.length).toBe(initialCount);
      expect(mockRuleFeedback.show).toHaveBeenCalledWith({
        allowed: false,
        message: "Connection already exists between Object and Function",
        ruleName: "Duplicate Connection",
      });
    });

    test("should not create connection when blocking rule exists", () => {
      const element1 = new AppElement("object", 100, 200);
      const element2 = new AppElement("function", 300, 400);
      appState.addElement(element1);
      appState.addElement(element2);

      const blockingResult = {
        allowed: false,
        message: "Cannot connect these elements",
        ruleName: "Connection Rule",
      };
      mockRuleEngine.getBlockingResult.mockReturnValue(blockingResult);

      inputState.activeId = element2.id;
      inputState.secondaryId = element1.id;
      inputState.executeAction("connect");
      const initialCount = appState.connections.length;

      logicLayer.processInput();

      expect(appState.connections.length).toBe(initialCount);
      expect(mockRuleFeedback.show).toHaveBeenCalledWith(blockingResult);
    });

    test("should check for reverse duplicate connection", () => {
      const element1 = new AppElement("object", 100, 200);
      const element2 = new AppElement("function", 300, 400);
      appState.addElement(element1);
      appState.addElement(element2);

      const existingConnection = new Connection(element2, element1);
      appState.addConnection(existingConnection);

      inputState.activeId = element2.id;
      inputState.secondaryId = element1.id;
      inputState.executeAction("connect");
      const initialCount = appState.connections.length;

      logicLayer.processInput();

      expect(appState.connections.length).toBe(initialCount);
      expect(mockRuleFeedback.show).toHaveBeenCalled();
    });
  });

  describe("processInput - disconnect action", () => {
    test("should handle disconnect action (todo implementation)", () => {
      inputState.executeAction("disconnect");

      logicLayer.processInput();

      // todo
    });
  });

  describe("processInput - details action", () => {
    test("should toggle details view", () => {
      const initialDetails = appState.details;
      inputState.executeAction("details");

      logicLayer.processInput();

      expect(appState.details).toBe(!initialDetails);
    });
  });

  describe("processInput - select action", () => {
    test("should select element and hide rule feedback", () => {
      const element = new AppElement("object", 100, 200);
      appState.addElement(element);

      inputState.executeAction("select");
      inputState.activeId = element.id;

      logicLayer.processInput();

      expect(appState.selectedElement).toBe(element);
      expect(mockRuleFeedback.hide).toHaveBeenCalled();
    });

    test("should restart layout if layout is enabled", () => {
      appState.layout = true;
      inputState.executeAction("select");

      logicLayer.processInput();

      expect(mockForceDirectedLayout.start).toHaveBeenCalled();
    });
  });

  describe("processInput - anchor action", () => {
    test("should toggle element anchor state", () => {
      const element = new AppElement("object", 100, 200);
      appState.addElement(element);
      const initialAnchorState = element.isAnchored;

      inputState.executeAction("anchor");
      inputState.activeId = element.id;

      logicLayer.processInput();

      expect(element.isAnchored).toBe(!initialAnchorState);
    });
  });

  describe("processInput - delete action", () => {
    test("should delete element and its connections", () => {
      const element1 = new AppElement("object", 100, 200);
      const element2 = new AppElement("function", 300, 400);
      appState.addElement(element1);
      appState.addElement(element2);

      const connection = new Connection(element1, element2);
      appState.addConnection(connection);

      inputState.executeAction("delete");
      inputState.activeId = element1.id;

      logicLayer.processInput();

      expect(appState.elements).not.toContain(element1);
      expect(appState.connections).not.toContain(connection);
      expect(appState.selectedElement).toBeUndefined();
      expect(appState.contextMenu).toBe(false);
    });

    test("should delete element recursively with children", () => {
      const parent = new AppElement("object", 100, 200);
      const child1 = new AppElement("function", 150, 250, parent);
      const child2 = new AppElement("collection", 200, 300, parent);
      const grandchild = new AppElement("input", 250, 350, child1);

      appState.addElement(parent);
      appState.addElement(child1);
      appState.addElement(child2);
      appState.addElement(grandchild);

      inputState.executeAction("delete");
      inputState.activeId = parent.id;

      logicLayer.processInput();

      expect(appState.elements).not.toContain(parent);
      expect(appState.elements).not.toContain(child1);
      expect(appState.elements).not.toContain(child2);
      expect(appState.elements).not.toContain(grandchild);
    });

    test("should restart layout if layout is enabled", () => {
      appState.layout = true;
      const element = new AppElement("object", 100, 200);
      appState.addElement(element);

      inputState.executeAction("delete");
      inputState.activeId = element.id;

      logicLayer.processInput();

      expect(mockForceDirectedLayout.start).toHaveBeenCalled();
    });
  });

  describe("processInput - edit action", () => {
    test("should set editing element and update text", () => {
      const element = new AppElement("object", 100, 200);
      appState.addElement(element);

      inputState.executeAction("edit", "New text content");
      inputState.activeId = element.id;

      logicLayer.processInput();

      expect(appState.editingElement).toBe(element);
      expect(element.text).toBe("New text content");
      expect(appState.contextMenu).toBe(false);
    });

    test("should set editing element without updating text when no text provided", () => {
      const element = new AppElement("object", 100, 200);
      element.text = "Original text";
      appState.addElement(element);

      inputState.executeAction("edit");
      inputState.activeId = element.id;

      logicLayer.processInput();

      expect(appState.editingElement).toBe(element);
      expect(element.text).toBe("Original text");
    });
  });

  describe("processInput - menu action", () => {
    test("should show context menu at mouse position", () => {
      const mousePos = { x: 150, y: 250 };
      inputState.executeAction("menu");
      inputState.mousePosition = mousePos;

      logicLayer.processInput();

      expect(appState.contextMenu).toBe(true);
      expect(appState.targetPosition).toEqual(mousePos);
    });
  });

  describe("processInput - export action", () => {
    test("should save project", () => {
      inputState.executeAction("export");

      logicLayer.processInput();

      expect(mockProjectManager.saveProject).toHaveBeenCalled();
    });
  });

  describe("processInput - import action", () => {
    test("should load project and restart layout", () => {
      inputState.executeAction("import");

      logicLayer.processInput();

      expect(mockProjectManager.loadProject).toHaveBeenCalled();
    });

    test("should restart layout if layout is enabled after import", () => {
      appState.layout = true;
      inputState.executeAction("import");

      logicLayer.processInput();

      expect(mockForceDirectedLayout.start).toHaveBeenCalled();
    });
  });

  describe("processInput - clear action", () => {
    test("should clear app state and stop layout", () => {
      const element = new AppElement("object", 100, 200);
      appState.addElement(element);

      inputState.executeAction("clear");

      logicLayer.processInput();

      expect(appState.elements).toEqual([]);
      expect(appState.connections).toEqual([]);
      expect(mockForceDirectedLayout.stop).toHaveBeenCalled();
    });
  });

  describe("processInput - zoom actions", () => {
    test("should update app state zoom and pan for zoomIn", () => {
      inputState.executeAction("zoomIn");
      const expectedZoom = inputState.zoom;
      const expectedPan = inputState.pan;

      logicLayer.processInput();

      expect(appState.zoom).toBe(expectedZoom);
      expect(appState.pan).toEqual(expectedPan);
    });

    test("should update app state zoom and pan for zoomOut", () => {
      inputState.executeAction("zoomOut");
      const expectedZoom = inputState.zoom;
      const expectedPan = inputState.pan;

      logicLayer.processInput();

      expect(appState.zoom).toBe(expectedZoom);
      expect(appState.pan).toEqual(expectedPan);
    });

    test("should update app state zoom and pan for zoomReset", () => {
      inputState.executeAction("zoomReset");
      const expectedZoom = inputState.zoom;
      const expectedPan = inputState.pan;

      logicLayer.processInput();

      expect(appState.zoom).toBe(expectedZoom);
      expect(appState.pan).toEqual(expectedPan);
    });
  });

  describe("processInput - mode action", () => {
    test("should update app state current mode", () => {
      inputState.setMode("edit");

      logicLayer.processInput();

      expect(appState.currentMode).toBe("edit");
    });
  });

  describe("processInput - state synchronization", () => {
    test("should clear editing element when not editing", () => {
      const element = new AppElement("object", 100, 200);
      appState.editingElement = element;
      inputState.isEditing = false;

      inputState.executeAction("select");

      logicLayer.processInput();

      expect(appState.editingElement).toBeUndefined();
    });

    test("should preserve editing element when editing", () => {
      const element = new AppElement("object", 100, 200);
      appState.editingElement = element;
      inputState.isEditing = true;

      inputState.executeAction("edit");

      logicLayer.processInput();

      expect(appState.editingElement).toBe(element);
    });

    test("should synchronize all state properties", () => {
      const element = new AppElement("object", 100, 200);
      appState.addElement(element);

      inputState.setMode("move");
      inputState.setElementType("function");
      inputState.activeId = element.id;

      logicLayer.processInput();

      expect(appState.currentMode).toBe("move");
      expect(appState.elementType).toBe("function");
      expect(appState.selectedElement).toBe(element);
    });

    test("should update inputState activeId and secondaryId from processing", () => {
      inputState.executeAction("create");
      inputState.mousePosition = { x: 100, y: 200 };
      const oldActiveId = inputState.activeId;

      logicLayer.processInput();

      expect(inputState.activeId).not.toBe(oldActiveId);
      expect(inputState.activeId).toBeDefined();
    });
  });

  describe("layout management", () => {
    test("should restart layout with correct parameters", () => {
      appState.layout = true;
      const element1 = new AppElement("object", 100, 200);
      const element2 = new AppElement("function", 300, 400);
      appState.addElement(element1);
      appState.addElement(element2);

      inputState.executeAction("select");
      inputState.secondaryId = element1.id;

      logicLayer.processInput();

      expect(mockForceDirectedLayout.stop).toHaveBeenCalled();
      expect(mockForceDirectedLayout.start).toHaveBeenCalledWith(
        appState.getRootElements(),
        appState.connections,
        [element1.id]
      );
    });

    test("should not restart layout when layout is disabled", () => {
      appState.layout = false;
      inputState.executeAction("create");
      inputState.mousePosition = { x: 100, y: 200 };

      logicLayer.processInput();

      expect(mockForceDirectedLayout.start).not.toHaveBeenCalled();
    });
  });

  describe("rule engine integration", () => {
    test("should evaluate element creation rules", () => {
      inputState.executeAction("create");
      inputState.mousePosition = { x: 100, y: 200 };
      inputState.elementType = "object";

      logicLayer.processInput();

      expect(mockRuleEngine.evaluateElementCreation).toHaveBeenCalledWith(
        expect.any(AppElement),
        appState
      );
      expect(mockRuleEngine.getBlockingResult).toHaveBeenCalled();
    });

    test("should evaluate connection rules", () => {
      const element1 = new AppElement("object", 100, 200);
      const element2 = new AppElement("function", 300, 400);
      appState.addElement(element1);
      appState.addElement(element2);

      inputState.activeId = element2.id;
      inputState.secondaryId = element1.id;
      inputState.executeAction("connect");

      logicLayer.processInput();

      expect(mockRuleEngine.evaluateConnection).toHaveBeenCalledWith(
        element1,
        element2,
        appState
      );
      expect(mockRuleEngine.getBlockingResult).toHaveBeenCalled();
    });
  });
});
