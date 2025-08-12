import { AppElement } from "../../_models/AppElement.ts";
import { Connection } from "../../_models/Connection.ts";
import { Point } from "../../types.ts";

export interface ForceDirectedConfig {
  repulsionForce: number;
  attractionForce: number;
  damping: number;
  minDistance: number;
  maxForce: number;
  iterations: number;
  springLength: number;
  movementThreshold: number;
  stopThreshold: number;
  centerAttractionForce: number;
  childScaleFactor: number;
  childCenterStrength: number;
}

const BASE_UNIT = 125;

export class ForceDirectedLayout {
  private config: ForceDirectedConfig;
  private velocities = new Map<string, Point>();
  private forces = new Map<string, Point>();
  private connectionMap = new Map<string, AppElement[]>();
  private isRunning = false;
  private animationId?: number;
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
      centerAttractionForce: 0.01,
      childScaleFactor: 0.7,
      childCenterStrength: 0.15,
      ...config,
    };
  }

  private getCanvasCenter(): Point {
    if (!this.canvasElement) return { x: 0, y: 0 };
    return {
      x: this.canvasElement.offsetWidth / 2,
      y: this.canvasElement.offsetHeight / 2,
    };
  }

  private getAllElements(elements: AppElement[]): AppElement[] {
    const result: AppElement[] = [];
    const collect = (items: AppElement[]) => {
      items.forEach((item) => {
        result.push(item);
        if (item.children?.length) collect(item.children);
      });
    };
    collect(elements);
    return result;
  }

  private initializeState(elements: AppElement[]) {
    const allElements = this.getAllElements(elements);
    allElements.forEach((e) => {
      if (!this.velocities.has(e.id)) this.velocities.set(e.id, { x: 0, y: 0 });
      if (!this.forces.has(e.id)) this.forces.set(e.id, { x: 0, y: 0 });
    });
  }

  private buildConnectionMap(connections: Connection[]) {
    this.connectionMap.clear();
    connections.forEach((c) => {
      if (c.from.depth === c.to.depth) {
        if (!this.connectionMap.has(c.from.id))
          this.connectionMap.set(c.from.id, []);
        if (!this.connectionMap.has(c.to.id))
          this.connectionMap.set(c.to.id, []);
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

    this.initializeState(elements);
    this.buildConnectionMap(connections);
    this.animate(elements);
  }

  stop() {
    this.isRunning = false;
    if (this.animationId) cancelAnimationFrame(this.animationId);
  }

  private animate = (elements: AppElement[]) => {
    if (!this.isRunning) return;

    const totalMovement = this.step(elements);
    if (totalMovement < this.config.stopThreshold) {
      this.stop();
      return;
    }

    this.animationId = requestAnimationFrame(() => this.animate(elements));
  };

  private step(elements: AppElement[]): number {
    let totalMovement = 0;

    for (let i = 0; i < this.config.iterations; i++) {
      this.calculateForces(elements, this.getCanvasCenter(), 0);
      totalMovement += this.updatePositions(elements);
    }

    return totalMovement;
  }

  private calculateForces(
    elements: AppElement[],
    centerPoint: Point,
    depth: number
  ) {
    const scaleFactor = Math.pow(this.config.childScaleFactor, depth);

    elements.forEach((e) => {
      const f = this.forces.get(e.id)!;
      f.x = f.y = 0;
    });

    elements.forEach((e1) => {
      if (e1.isAnchored || this.ignoreElementIds.includes(e1.id)) return;

      const f1 = this.forces.get(e1.id)!;

      elements.forEach((e2) => {
        if (e1.id === e2.id || this.ignoreElementIds.includes(e2.id)) return;

        const dx = e1.x - e2.x;
        const dy = e1.y - e2.y;
        const distSq = dx * dx + dy * dy;

        if (distSq === 0) {
          f1.x += (Math.random() - 0.5) * scaleFactor;
          f1.y += (Math.random() - 0.5) * scaleFactor;
          return;
        }

        const dist = Math.sqrt(distSq);
        const minDist = this.config.minDistance * scaleFactor;

        if (dist < minDist * 3) {
          let force = (this.config.repulsionForce * scaleFactor) / distSq;
          if (dist < minDist) force *= 2;

          f1.x += (dx / dist) * force;
          f1.y += (dy / dist) * force;
        }
      });

      this.connectionMap.get(e1.id)?.forEach((e2) => {
        if (e1.depth !== e2.depth) return;

        const dx = e2.x - e1.x;
        const dy = e2.y - e1.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 0) {
          const springLength = this.config.springLength * scaleFactor;
          const springForce =
            (dist - springLength) * this.config.attractionForce * scaleFactor;

          f1.x += (dx / dist) * springForce;
          f1.y += (dy / dist) * springForce;

          const absDx = Math.abs(dx);
          const absDy = Math.abs(dy);
          const alignmentForce = 0.3 * scaleFactor;

          if (absDx > absDy) {
            const targetY = e1.y;
            const alignForceY = (targetY - e2.y) * alignmentForce;
            f1.y -= alignForceY * 0.5;
            const f2 = this.forces.get(e2.id);
            if (f2) f2.y += alignForceY * 0.5;
          } else {
            const targetX = e1.x;
            const alignForceX = (targetX - e2.x) * alignmentForce;
            f1.x -= alignForceX * 0.5;
            const f2 = this.forces.get(e2.id);
            if (f2) f2.x += alignForceX * 0.5;
          }
        }
      });

      const centerForce =
        depth === 0
          ? this.config.centerAttractionForce
          : this.config.childCenterStrength;

      f1.x += (centerPoint.x - e1.x) * centerForce * scaleFactor;
      f1.y += (centerPoint.y - e1.y) * centerForce * scaleFactor;

      const maxForce = this.config.maxForce * scaleFactor;
      const forceMag = Math.sqrt(f1.x * f1.x + f1.y * f1.y);
      if (forceMag > maxForce) {
        f1.x = (f1.x / forceMag) * maxForce;
        f1.y = (f1.y / forceMag) * maxForce;
      }

      const v = this.velocities.get(e1.id)!;
      v.x = (v.x + f1.x) * this.config.damping;
      v.y = (v.y + f1.y) * this.config.damping;
    });

    elements.forEach((element) => {
      if (element.children?.length) {
        this.calculateForces(
          element.children,
          { x: element.x, y: element.y },
          depth + 1
        );
      }
    });
  }

  private updatePositions(elements: AppElement[]): number {
    const updateLevel = (items: AppElement[], depth: number): number => {
      let levelMovement = 0;
      const scaleFactor = Math.pow(this.config.childScaleFactor, depth);
      const threshold = this.config.movementThreshold * scaleFactor;

      items.forEach((e) => {
        if (e.isAnchored || this.ignoreElementIds.includes(e.id)) return;

        const v = this.velocities.get(e.id)!;
        const mag = Math.sqrt(v.x * v.x + v.y * v.y);

        if (mag > threshold) {
          e.x += v.x;
          e.y += v.y;
          levelMovement += mag;
        }

        if (e.children?.length) {
          levelMovement += updateLevel(e.children, depth + 1);
        }
      });

      return levelMovement;
    };

    return updateLevel(elements, 0);
  }

  updateConfig(newConfig: Partial<ForceDirectedConfig>) {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): ForceDirectedConfig {
    return { ...this.config };
  }
}
