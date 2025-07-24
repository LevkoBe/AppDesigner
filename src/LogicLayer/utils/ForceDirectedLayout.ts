import { AppElement } from "../../_models/AppElement.ts";
import { Connection } from "../../_models/Connection.ts";
import { Point } from "../../types.ts";

export interface ForceDirectedConfig {
  repulsionForce: number; // The strength of the repulsive force between elements. Higher values push elements further apart.
  attractionForce: number; // The strength of the attractive force between connected elements (spring force). Higher values pull connected elements closer.
  damping: number; // Reduces the velocity of elements over time, preventing perpetual motion and helping the simulation settle.
  minDistance: number; // The minimum distance between elements before repulsion significantly increases.
  maxForce: number; // The maximum force that can be applied to an element in a single iteration, preventing erratic movement.
  iterations: number; // The number of simulation steps to run per animation frame. More iterations lead to faster convergence but higher CPU usage.
  springLength: number; // The ideal length of the "spring" between connected elements. Elements will try to maintain this distance.
  movementThreshold: number; // The minimum movement an element must have in an iteration for its position to be updated. Helps in stabilizing the layout.
  stopThreshold: number; // The total movement threshold for all elements. If the total movement falls below this, the simulation stops.
  gridForce: number; // The strength of the force that pulls elements towards the nearest grid intersection.
  centerAttractionForce: number; // The strength of the force that pulls all elements towards the center of the canvas.
  gridSize: number; // The size of the grid cells. Elements will try to align to this grid.
  spatialHashSize: number; // The size of the cells used in the spatial hash for optimizing repulsion force calculations.
  maxRepulsionDistance: number; // The maximum distance over which repulsion forces are calculated. Beyond this, elements don't repel each other.
  connectionGridAlignForce: number; // The strength of the force that aligns connected elements to the grid, particularly when they are nearly horizontal or vertical.
  gridRepulsionFactor: number; // A multiplier applied to the repulsion force when elements are closely aligned with the grid, encouraging grid-based spacing.
  perfectAlignmentThreshold: number; // The distance threshold within which an element is considered "perfectly aligned" to a grid line, leading to snapping.
  // Simulated annealing parameters
  annealingRate: number; // How quickly the temperature decreases (0.99 = slow cooling, 0.9 = fast cooling)
  minTemperature: number; // Minimum temperature multiplier (final stabilization level)
  coolingDelay: number; // Time in milliseconds before cooling starts after user interaction
  reheatOnInteraction: boolean; // Whether to reheat when user interacts with elements
  // Hierarchical parameters
  childScaleFactor: number; // Scale factor for child element forces and distances
  childCenterStrength: number; // Strength of attraction to parent center for child elements
}

const BASE_UNIT = 125;

interface LayoutContext {
  center: Point;
  depth: number;
  parentElement?: AppElement;
}

export class ForceDirectedLayout {
  private config: ForceDirectedConfig;
  private velocities = new Map<string, Point>();
  private forces = new Map<string, Point>();
  private connectionMap = new Map<string, AppElement[]>();
  private isRunning = false;
  private animationId?: number;
  private temperature = 1.0;
  private lastInteractionTime = Date.now();
  private coolingStartTime = 0;
  private ignoreElementIds: string[] = [];

  constructor(
    private canvasElement: HTMLElement,
    config: Partial<ForceDirectedConfig> = {}
  ) {
    this.config = {
      repulsionForce: 2000,
      attractionForce: 0.5,
      damping: 0.5,
      minDistance: BASE_UNIT,
      maxForce: 10,
      iterations: 1,
      springLength: BASE_UNIT,
      movementThreshold: 0.1,
      stopThreshold: 0.05,
      gridForce: 0.08,
      centerAttractionForce: 0.01,
      gridSize: BASE_UNIT / 2,
      spatialHashSize: 300,
      maxRepulsionDistance: 250,
      connectionGridAlignForce: 0.1,
      gridRepulsionFactor: 0.5,
      perfectAlignmentThreshold: 5,
      annealingRate: 0.8,
      minTemperature: 0.05,
      coolingDelay: 2000,
      reheatOnInteraction: true,
      childScaleFactor: 0.7,
      childCenterStrength: 0.15,
      ...config,
    };
  }

  setCanvasElement(element: HTMLElement) {
    this.canvasElement = element;
  }

  private getCanvasCenter(): Point {
    if (!this.canvasElement) return { x: 0, y: 0 };
    const center = {
      x: this.canvasElement.offsetWidth / 2,
      y: this.canvasElement.offsetHeight / 2,
    };
    return center;
  }

  private updateTemperature() {
    const now = Date.now();
    const timeSinceInteraction = now - this.lastInteractionTime;
    if (timeSinceInteraction < this.config.coolingDelay) {
      return;
    }
    if (this.coolingStartTime === 0) {
      this.coolingStartTime = now;
    }
    if (this.temperature > this.config.minTemperature) {
      this.temperature *= this.config.annealingRate;
      this.temperature = Math.max(this.temperature, this.config.minTemperature);
    }
  }

  private getAllElements(elements: AppElement[]): AppElement[] {
    const allElements: AppElement[] = [];

    const collectElements = (elementsToProcess: AppElement[]) => {
      elementsToProcess.forEach((element) => {
        allElements.push(element);
        if (element.children && element.children.length > 0) {
          collectElements(element.children);
        }
      });
    };

    collectElements(elements);
    return allElements;
  }

  private initializeElementState(elements: AppElement[]) {
    const allElements = this.getAllElements(elements);

    allElements.forEach((e) => {
      if (!this.velocities.has(e.id)) {
        this.velocities.set(e.id, { x: 0, y: 0 });
      }
      if (!this.forces.has(e.id)) {
        this.forces.set(e.id, { x: 0, y: 0 });
      }
    });
  }

  private buildConnectionMap(connections: Connection[]) {
    this.connectionMap.clear();

    connections.forEach((c) => {
      if (c.from.depth === c.to.depth) {
        if (!this.connectionMap.has(c.from.id)) {
          this.connectionMap.set(c.from.id, []);
        }
        if (!this.connectionMap.has(c.to.id)) {
          this.connectionMap.set(c.to.id, []);
        }
        this.connectionMap.get(c.from.id)!.push(c.to);
        this.connectionMap.get(c.to.id)!.push(c.from);
      }
    });
  }

  start(
    elements: AppElement[],
    connections: Connection[],
    ignoreElementIds: string[]
  ) {
    this.ignoreElementIds = ignoreElementIds;
    if (this.isRunning) return;
    this.isRunning = true;

    this.velocities.clear();
    this.forces.clear();

    this.initializeElementState(elements);
    this.buildConnectionMap(connections);

    this.temperature = 1.0;
    this.lastInteractionTime = Date.now();
    this.coolingStartTime = 0;

    this.animate(elements, connections);
  }

  stop() {
    this.isRunning = false;
    if (this.animationId) cancelAnimationFrame(this.animationId);
  }

  step(elements: AppElement[]): number {
    if (!elements.length) return 0;

    this.updateTemperature();
    let totalMovement = 0;

    for (let i = 0; i < this.config.iterations; i++) {
      totalMovement += this.calculateForcesHierarchical(elements, {
        center: this.getCanvasCenter(),
        depth: 0,
      });
      totalMovement += this.updatePositionsHierarchical(elements);
    }

    return totalMovement;
  }

  private animate = (elements: AppElement[], connections: Connection[]) => {
    if (!this.isRunning) return;

    const movement = this.step(elements);
    const adjustedStopThreshold =
      this.config.stopThreshold * (0.1 + this.temperature * 0.9);

    if (
      movement < adjustedStopThreshold &&
      this.temperature <= this.config.minTemperature
    ) {
      this.stop();
      return;
    }

    this.animationId = requestAnimationFrame(() =>
      this.animate(elements, connections)
    );
  };

  private calculateForcesHierarchical(
    elements: AppElement[],
    context: LayoutContext
  ): number {
    let totalMovement = 0;

    totalMovement += this.calculateForcesForLevel(elements, context);

    elements.forEach((element) => {
      if (element.children && element.children.length > 0) {
        const childContext: LayoutContext = {
          center: { x: element.x, y: element.y },
          depth: context.depth + 1,
          parentElement: element,
        };
        totalMovement += this.calculateForcesHierarchical(
          element.children,
          childContext
        );
      }
    });

    return totalMovement;
  }

  private calculateForcesForLevel(
    elements: AppElement[],
    context: LayoutContext
  ): number {
    const { center, depth } = context;
    const scaleFactor = Math.pow(this.config.childScaleFactor, depth);

    const levelSpatialHash = new Map<string, AppElement[]>();
    const adjustedHashSize = this.config.spatialHashSize * scaleFactor;

    elements.forEach((e) => {
      const key = `${Math.floor(e.x / adjustedHashSize)},${Math.floor(
        e.y / adjustedHashSize
      )}`;
      const bucket = levelSpatialHash.get(key) || [];
      if (!levelSpatialHash.has(key)) {
        levelSpatialHash.set(key, bucket);
      }
      bucket.push(e);
    });

    elements.forEach((e) => {
      const f = this.forces.get(e.id)!;
      f.x = f.y = 0;
    });

    elements.forEach((e1) => {
      if (e1.isAnchored) return;

      const f1 = this.forces.get(e1.id)!;
      const cellX = Math.floor(e1.x / adjustedHashSize);
      const cellY = Math.floor(e1.y / adjustedHashSize);

      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const nearby = levelSpatialHash.get(`${cellX + dx},${cellY + dy}`);
          if (!nearby) continue;

          nearby.forEach((e2) => {
            if (e1.id === e2.id || this.ignoreElementIds.includes(e2.id))
              return;

            const deltaX = e1.x - e2.x;
            const deltaY = e1.y - e2.y;
            const distSq = deltaX * deltaX + deltaY * deltaY;
            const maxRepulsionDist =
              this.config.maxRepulsionDistance * scaleFactor;

            if (distSq > maxRepulsionDist ** 2) return;

            if (distSq === 0) {
              f1.x += (Math.random() - 0.5) * this.temperature * scaleFactor;
              f1.y += (Math.random() - 0.5) * this.temperature * scaleFactor;
              return;
            }

            const dist = Math.sqrt(distSq);
            const adjustedMinDistance = this.config.minDistance * scaleFactor;
            let force =
              ((this.config.repulsionForce * scaleFactor) / distSq) *
              this.temperature;

            if (dist < adjustedMinDistance) {
              force +=
                (adjustedMinDistance - dist) *
                this.config.repulsionForce *
                scaleFactor *
                0.01 *
                this.temperature;
            }

            const adjustedGridSize = this.config.gridSize * scaleFactor;
            const isAlignedX =
              Math.abs(deltaX % adjustedGridSize) < 5 * scaleFactor ||
              Math.abs(deltaX % adjustedGridSize) >
                adjustedGridSize - 5 * scaleFactor;
            const isAlignedY =
              Math.abs(deltaY % adjustedGridSize) < 5 * scaleFactor ||
              Math.abs(deltaY % adjustedGridSize) >
                adjustedGridSize - 5 * scaleFactor;

            if (isAlignedX || isAlignedY) {
              force *= this.config.gridRepulsionFactor;
            }

            f1.x += (deltaX / dist) * force;
            f1.y += (deltaY / dist) * force;
          });
        }
      }

      this.connectionMap.get(e1.id)?.forEach((e2) => {
        if (e1.depth !== e2.depth) return;

        const dx = e2.x - e1.x;
        const dy = e2.y - e1.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist === 0) return;

        const adjustedSpringLength = this.config.springLength * scaleFactor;
        const springForce =
          (dist - adjustedSpringLength) *
          this.config.attractionForce *
          scaleFactor *
          this.temperature;

        f1.x += (dx / dist) * springForce;
        f1.y += (dy / dist) * springForce;

        const angle = Math.atan2(dy, dx);
        const angleThreshold = (10 * Math.PI) / 180;
        const alignForce =
          this.config.connectionGridAlignForce * scaleFactor * this.temperature;
        const adjustedGridSize = this.config.gridSize * scaleFactor;

        if (
          Math.abs(angle) < angleThreshold ||
          Math.abs(angle - Math.PI) < angleThreshold
        ) {
          const targetY =
            Math.round(e1.y / adjustedGridSize) * adjustedGridSize;
          f1.y += (targetY - e1.y) * alignForce;
          const targetY2 =
            Math.round(e2.y / adjustedGridSize) * adjustedGridSize;
          this.forces.get(e2.id)!.y += (targetY2 - e2.y) * alignForce;
        } else if (
          Math.abs(angle - Math.PI / 2) < angleThreshold ||
          Math.abs(angle + Math.PI / 2) < angleThreshold
        ) {
          const targetX =
            Math.round(e1.x / adjustedGridSize) * adjustedGridSize;
          f1.x += (targetX - e1.x) * alignForce;
          const targetX2 =
            Math.round(e2.x / adjustedGridSize) * adjustedGridSize;
          this.forces.get(e2.id)!.x += (targetX2 - e2.x) * alignForce;
        }
      });

      const adjustedGridSize = this.config.gridSize * scaleFactor;
      const targetX = Math.round(e1.x / adjustedGridSize) * adjustedGridSize;
      const targetY = Math.round(e1.y / adjustedGridSize) * adjustedGridSize;
      const gridForceMultiplier = Math.max(0.3, this.temperature);

      f1.x +=
        (targetX - e1.x) *
        this.config.gridForce *
        scaleFactor *
        gridForceMultiplier;
      f1.y +=
        (targetY - e1.y) *
        this.config.gridForce *
        scaleFactor *
        gridForceMultiplier;

      const centerForce =
        depth === 0
          ? this.config.centerAttractionForce
          : this.config.childCenterStrength;
      f1.x += (center.x - e1.x) * centerForce * scaleFactor * this.temperature;
      f1.y += (center.y - e1.y) * centerForce * scaleFactor * this.temperature;

      const adjustedMaxForce =
        this.config.maxForce * scaleFactor * Math.max(0.1, this.temperature);
      const forceMag = Math.sqrt(f1.x * f1.x + f1.y * f1.y);
      if (forceMag > adjustedMaxForce) {
        f1.x = (f1.x / forceMag) * adjustedMaxForce;
        f1.y = (f1.y / forceMag) * adjustedMaxForce;
      }

      const adjustedDamping =
        this.config.damping * (0.3 + this.temperature * 0.7);
      const v = this.velocities.get(e1.id)!;
      v.x = (v.x + f1.x) * adjustedDamping;
      v.y = (v.y + f1.y) * adjustedDamping;
    });

    return 0;
  }

  private updatePositionsHierarchical(elements: AppElement[]): number {
    let totalMovement = 0;

    totalMovement += this.updatePositionsForLevel(elements, 0);

    elements.forEach((element) => {
      if (element.children && element.children.length > 0) {
        totalMovement += this.updatePositionsHierarchical(element.children);
      }
    });

    return totalMovement;
  }

  private updatePositionsForLevel(
    elements: AppElement[],
    depth: number
  ): number {
    let totalMovement = 0;
    const scaleFactor = Math.pow(this.config.childScaleFactor, depth);

    elements.forEach((e) => {
      if (e.isAnchored || this.ignoreElementIds.includes(e.id)) return;

      const v = this.velocities.get(e.id)!;
      const mag = Math.sqrt(v.x * v.x + v.y * v.y);

      const adjustedThreshold =
        this.config.movementThreshold * scaleFactor * this.temperature;

      if (mag > adjustedThreshold) {
        e.x += v.x;
        e.y += v.y;
        totalMovement += mag;
      }

      const adjustedGridSize = this.config.gridSize * scaleFactor;
      const remainderX = e.x % adjustedGridSize;
      const remainderY = e.y % adjustedGridSize;

      const snapThreshold =
        this.config.perfectAlignmentThreshold *
        scaleFactor *
        (2 - this.temperature);

      const nearGridX =
        Math.abs(remainderX) < snapThreshold ||
        Math.abs(remainderX - adjustedGridSize) < snapThreshold ||
        Math.abs(remainderX + adjustedGridSize) < snapThreshold;

      const nearGridY =
        Math.abs(remainderY) < snapThreshold ||
        Math.abs(remainderY - adjustedGridSize) < snapThreshold ||
        Math.abs(remainderY + adjustedGridSize) < snapThreshold;

      if (nearGridX) {
        const snappedX = Math.round(e.x / adjustedGridSize) * adjustedGridSize;
        if (Math.abs(snappedX - e.x) > 0.01) {
          totalMovement += Math.abs(snappedX - e.x);
          e.x = snappedX;
        }
      }

      if (nearGridY) {
        const snappedY = Math.round(e.y / adjustedGridSize) * adjustedGridSize;
        if (Math.abs(snappedY - e.y) > 0.01) {
          totalMovement += Math.abs(snappedY - e.y);
          e.y = snappedY;
        }
      }
    });

    return totalMovement;
  }

  updateConfig(newConfig: Partial<ForceDirectedConfig>) {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): ForceDirectedConfig {
    return { ...this.config };
  }

  reheatSimulation() {
    if (this.config.reheatOnInteraction) {
      this.temperature = 1.0;
      this.lastInteractionTime = Date.now();
      this.coolingStartTime = 0;
    }
  }
}
