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
}

const BASE_UNIT = 125;

export class ForceDirectedLayout {
  private config: ForceDirectedConfig;
  private velocities = new Map<string, Point>();
  private forces = new Map<string, Point>();
  private spatialHash = new Map<string, AppElement[]>();
  private connectionMap = new Map<string, AppElement[]>();
  private isRunning = false;
  private animationId?: number;
  private canvasCenter = { x: 0, y: 0 };

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
      centerAttractionForce: 0.005,
      gridSize: BASE_UNIT,
      spatialHashSize: 300,
      maxRepulsionDistance: 250,
      connectionGridAlignForce: 0.1,
      gridRepulsionFactor: 0.5,
      perfectAlignmentThreshold: 5,
      ...config,
    };
  }

  setCanvasElement(element: HTMLElement) {
    this.canvasElement = element;
  }

  private getCanvasCenter(): Point {
    if (!this.canvasElement) return { x: 0, y: 0 };
    const rect = this.canvasElement.getBoundingClientRect();
    return { x: rect.width / 2, y: rect.height / 2 };
  }

  start(elements: AppElement[], connections: Connection[]) {
    if (this.isRunning) return;
    this.isRunning = true;

    this.velocities.clear();
    this.forces.clear();
    elements.forEach((e) => {
      this.velocities.set(e.id, { x: 0, y: 0 });
      this.forces.set(e.id, { x: 0, y: 0 });
    });

    this.connectionMap.clear();
    connections.forEach((c) => {
      if (!this.connectionMap.has(c.from.id)) {
        this.connectionMap.set(c.from.id, []);
      }
      if (!this.connectionMap.has(c.to.id)) {
        this.connectionMap.set(c.to.id, []);
      }
      this.connectionMap.get(c.from.id)!.push(c.to);
      this.connectionMap.get(c.to.id)!.push(c.from);
    });

    this.animate(elements, connections);
  }

  stop() {
    this.isRunning = false;
    if (this.animationId) cancelAnimationFrame(this.animationId);
  }

  step(elements: AppElement[]): number {
    if (!elements.length) return 0;

    let totalMovement = 0;
    for (let i = 0; i < this.config.iterations; i++) {
      this.calculateForces(elements);
      totalMovement = this.updatePositions(elements);
    }
    return totalMovement;
  }

  private animate = (elements: AppElement[], connections: Connection[]) => {
    if (!this.isRunning) return;

    if (this.step(elements) < this.config.stopThreshold) {
      this.stop();
      return;
    }

    this.animationId = requestAnimationFrame(() =>
      this.animate(elements, connections)
    );
  };

  private calculateForces(elements: AppElement[]) {
    this.canvasCenter = this.getCanvasCenter();

    this.spatialHash.clear();
    elements.forEach((e) => {
      const key = `${Math.floor(
        e.x / this.config.spatialHashSize
      )},${Math.floor(e.y / this.config.spatialHashSize)}`;
      (
        this.spatialHash.get(key) || this.spatialHash.set(key, []).get(key)!
      ).push(e);
    });

    elements.forEach((e) => {
      const f = this.forces.get(e.id)!;
      f.x = f.y = 0;
    });

    elements.forEach((e1) => {
      if (e1.isAnchored) return;

      const f1 = this.forces.get(e1.id)!;
      const cellX = Math.floor(e1.x / this.config.spatialHashSize);
      const cellY = Math.floor(e1.y / this.config.spatialHashSize);

      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const nearby = this.spatialHash.get(`${cellX + dx},${cellY + dy}`);
          if (!nearby) continue;

          nearby.forEach((e2) => {
            if (e1.id === e2.id) return;
            const deltaX = e1.x - e2.x;
            const deltaY = e1.y - e2.y;
            const distSq = deltaX * deltaX + deltaY * deltaY;

            if (distSq > this.config.maxRepulsionDistance ** 2) return;
            if (distSq === 0) {
              f1.x += Math.random() - 0.5;
              f1.y += Math.random() - 0.5;
              return;
            }

            const dist = Math.sqrt(distSq);
            let force = this.config.repulsionForce / distSq;

            if (dist < this.config.minDistance) {
              force +=
                (this.config.minDistance - dist) *
                this.config.repulsionForce *
                0.01;
            }

            const isAlignedX =
              Math.abs(deltaX % this.config.gridSize) < 5 ||
              Math.abs(deltaX % this.config.gridSize) >
                this.config.gridSize - 5;
            const isAlignedY =
              Math.abs(deltaY % this.config.gridSize) < 5 ||
              Math.abs(deltaY % this.config.gridSize) >
                this.config.gridSize - 5;

            if (isAlignedX || isAlignedY) {
              force *= this.config.gridRepulsionFactor;
            }

            f1.x += (deltaX / dist) * force;
            f1.y += (deltaY / dist) * force;
          });
        }
      }

      this.connectionMap.get(e1.id)?.forEach((e2) => {
        const dx = e2.x - e1.x;
        const dy = e2.y - e1.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist === 0) return;

        const springForce =
          (dist - this.config.springLength) * this.config.attractionForce;
        f1.x += (dx / dist) * springForce;
        f1.y += (dy / dist) * springForce;

        const angle = Math.atan2(dy, dx);
        const angleThreshold = (10 * Math.PI) / 180;

        if (
          Math.abs(angle) < angleThreshold ||
          Math.abs(angle - Math.PI) < angleThreshold
        ) {
          const targetY =
            Math.round(e1.y / this.config.gridSize) * this.config.gridSize;
          f1.y += (targetY - e1.y) * this.config.connectionGridAlignForce;
          const targetY2 =
            Math.round(e2.y / this.config.gridSize) * this.config.gridSize;
          this.forces.get(e2.id)!.y +=
            (targetY2 - e2.y) * this.config.connectionGridAlignForce;
        } else if (
          Math.abs(angle - Math.PI / 2) < angleThreshold ||
          Math.abs(angle + Math.PI / 2) < angleThreshold
        ) {
          const targetX =
            Math.round(e1.x / this.config.gridSize) * this.config.gridSize;
          f1.x += (targetX - e1.x) * this.config.connectionGridAlignForce;
          const targetX2 =
            Math.round(e2.x / this.config.gridSize) * this.config.gridSize;
          this.forces.get(e2.id)!.x +=
            (targetX2 - e2.x) * this.config.connectionGridAlignForce;
        }
      });

      const targetX =
        Math.round(e1.x / this.config.gridSize) * this.config.gridSize;
      const targetY =
        Math.round(e1.y / this.config.gridSize) * this.config.gridSize;
      f1.x += (targetX - e1.x) * this.config.gridForce;
      f1.y += (targetY - e1.y) * this.config.gridForce;

      f1.x += (this.canvasCenter.x - e1.x) * this.config.centerAttractionForce;
      f1.y += (this.canvasCenter.y - e1.y) * this.config.centerAttractionForce;

      const forceMag = Math.sqrt(f1.x * f1.x + f1.y * f1.y);
      if (forceMag > this.config.maxForce) {
        f1.x = (f1.x / forceMag) * this.config.maxForce;
        f1.y = (f1.y / forceMag) * this.config.maxForce;
      }

      const v = this.velocities.get(e1.id)!;
      v.x = (v.x + f1.x) * this.config.damping;
      v.y = (v.y + f1.y) * this.config.damping;
    });
  }

  private updatePositions(elements: AppElement[]): number {
    let totalMovement = 0;

    elements.forEach((e) => {
      if (e.isAnchored) return;

      const v = this.velocities.get(e.id)!;
      const mag = Math.sqrt(v.x * v.x + v.y * v.y);

      if (mag > this.config.movementThreshold) {
        e.x += v.x;
        e.y += v.y;
      }

      const remainderX = e.x % this.config.gridSize;
      const remainderY = e.y % this.config.gridSize;

      const nearGridX =
        Math.abs(remainderX) < this.config.perfectAlignmentThreshold ||
        Math.abs(remainderX - this.config.gridSize) <
          this.config.perfectAlignmentThreshold ||
        Math.abs(remainderX + this.config.gridSize) <
          this.config.perfectAlignmentThreshold;

      const nearGridY =
        Math.abs(remainderY) < this.config.perfectAlignmentThreshold ||
        Math.abs(remainderY - this.config.gridSize) <
          this.config.perfectAlignmentThreshold ||
        Math.abs(remainderY + this.config.gridSize) <
          this.config.perfectAlignmentThreshold;

      if (nearGridX) {
        const snappedX =
          Math.round(e.x / this.config.gridSize) * this.config.gridSize;
        if (Math.abs(snappedX - e.x) > 0.01) {
          totalMovement += Math.abs(snappedX - e.x);
          e.x = snappedX;
        }
      }

      if (nearGridY) {
        const snappedY =
          Math.round(e.y / this.config.gridSize) * this.config.gridSize;
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
}
