import { describe, beforeEach, test, expect } from "vitest";
import { AppElement } from "../../src/_models/AppElement";
import { Connection } from "../../src/_models/Connection";
import { AppState } from "../../src/LogicLayer/AppState";

describe("AppState", () => {
  let appState: AppState;
  let element1: AppElement;
  let element2: AppElement;

  beforeEach(() => {
    appState = new AppState();
    element1 = new AppElement("object", 100, 200);
    element2 = new AppElement("function", 300, 400);
  });

  describe("constructor", () => {
    test("should initialize with default values", () => {
      expect(appState.currentMode).toBe("create");
      expect(appState.elementType).toBe("object");
      expect(appState.elements).toEqual([]);
      expect(appState.connections).toEqual([]);
      expect(appState.zoom).toBe(1);
      expect(appState.pan).toEqual({ x: 0, y: 0 });
      expect(appState.layout).toBe(true);
    });
  });

  describe("element management", () => {
    test("should add element", () => {
      appState.addElement(element1);
      expect(appState.elements).toContain(element1);
    });

    test("should remove element by id", () => {
      appState.addElement(element1);
      appState.removeElement(element1.id);
      expect(appState.elements).not.toContain(element1);
    });

    test("should get element by id", () => {
      appState.addElement(element1);
      const found = appState.getElementById(element1.id);
      expect(found).toBe(element1);
    });

    test("should return undefined for non-existent element", () => {
      const found = appState.getElementById("non-existent");
      expect(found).toBeUndefined();
    });
  });

  describe("connection management", () => {
    test("should add connection", () => {
      const connection = new Connection(element1, element2);
      appState.addConnection(connection);
      expect(appState.connections).toContain(connection);
    });

    test("should remove connection by id", () => {
      const connection = new Connection(element1, element2);
      appState.addConnection(connection);
      appState.removeConnection(connection.id);
      expect(appState.connections).not.toContain(connection);
    });

    test("should remove connections for element", () => {
      const connection = new Connection(element1, element2);
      appState.addConnection(connection);
      appState.removeConnectionsFor(element1.id);
      expect(appState.connections).toEqual([]);
    });

    test("should check if connection exists", () => {
      const connection = new Connection(element1, element2);
      appState.addConnection(connection);

      expect(appState.hasConnection(element1.id, element2.id)).toBe(true);
      expect(appState.hasConnection(element2.id, element1.id)).toBe(true);
      expect(appState.hasConnection(element1.id, "other")).toBe(false);
    });
  });

  describe("getRootElements", () => {
    test("should return elements without parent", () => {
      const child = new AppElement("object", 50, 50, element1);
      element1.children.push(child);

      appState.addElement(element1);
      appState.addElement(child);

      const roots = appState.getRootElements();
      expect(roots).toContain(element1);
      expect(roots).not.toContain(child);
    });

    test("should apply predicate filter", () => {
      element1.type = "object";
      element2.type = "function";
      appState.addElement(element1);
      appState.addElement(element2);

      const objectRoots = appState.getRootElements((e) => e.type === "object");
      expect(objectRoots).toContain(element1);
      expect(objectRoots).not.toContain(element2);
    });
  });

  describe("selectElement", () => {
    test("should set selected element", () => {
      appState.selectElement(element1);
      expect(appState.selectedElement).toBe(element1);
    });

    test("should clear selected element", () => {
      appState.selectElement(element1);
      appState.selectElement(undefined);
      expect(appState.selectedElement).toBeUndefined();
    });
  });

  describe("serialization", () => {
    test("should serialize state to JSON", () => {
      appState.addElement(element1);
      const connection = new Connection(element1, element2);
      appState.addConnection(connection);

      const json = appState.serialize();
      const parsed = JSON.parse(json);

      expect(parsed.elements).toHaveLength(1);
      expect(parsed.connections).toHaveLength(1);
    });

    test("should deserialize state from JSON", () => {
      const json = JSON.stringify({
        elements: [
          {
            id: "test-id",
            type: "object",
            x: 100,
            y: 200,
            text: "Test Element",
          },
        ],
        connections: [],
      });

      appState.deserialize(json);

      expect(appState.elements).toHaveLength(1);
      expect(appState.elements[0].id).toBe("test-id");
      expect(appState.elements[0].type).toBe("object");
      expect(appState.elements[0].text).toBe("Test Element");
    });
  });

  describe("clear", () => {
    test("should reset all state", () => {
      appState.addElement(element1);
      appState.selectElement(element1);
      appState.zoom = 2;
      appState.pan = { x: 100, y: 200 };

      appState.clear();

      expect(appState.elements).toEqual([]);
      expect(appState.connections).toEqual([]);
      expect(appState.selectedElement).toBeUndefined();
      expect(appState.zoom).toBe(1);
      expect(appState.pan).toEqual({ x: 0, y: 0 });
    });
  });
});
