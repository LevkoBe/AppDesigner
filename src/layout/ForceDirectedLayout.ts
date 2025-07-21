import { AppElement } from "../models/Element.ts";
import { Connection } from "../models/Connection.ts";
import { Point } from "../types.ts";

export interface ForceDirectedConfig {
  repulsionForce: number;
  attractionForce: number;
  damping: number;
  minDistance: number;
  maxForce: number;
  iterations: number;
  springLength: number;
}

export class ForceDirectedLayout {
  private config: ForceDirectedConfig;
  private velocities: Map<number, Point> = new Map();
  private isRunning: boolean = false;
  private animationId: number | undefined = undefined;

  constructor(config: Partial<ForceDirectedConfig> = {}) {
    this.config = {
      repulsionForce: 1000,
      attractionForce: 0.1,
      damping: 0.9,
      minDistance: 50,
      maxForce: 10,
      iterations: 1,
      springLength: 100,
      ...config,
    };
  }

  start(elements: AppElement[], connections: Connection[]): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.initializeVelocities(elements);
    this.animate(elements, connections);
  }

  stop(): void {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = undefined;
    }
  }

  step(elements: AppElement[], connections: Connection[]): void {
    if (elements.length === 0) return;

    const validConnections = connections.filter(
      (connection) =>
        elements.some((e) => e.id === connection.from.id) &&
        elements.some((e) => e.id === connection.to.id)
    );

    for (let i = 0; i < this.config.iterations; i++) {
      this.calculateForces(elements, validConnections);
      this.updatePositions(elements);
    }
  }

  private animate = (
    elements: AppElement[],
    connections: Connection[]
  ): void => {
    if (!this.isRunning) return;

    this.step(elements, connections);

    this.animationId = requestAnimationFrame(() => {
      this.animate(elements, connections);
    });
  };

  private initializeVelocities(elements: AppElement[]): void {
    this.velocities.clear();
    elements.forEach((element) => {
      this.velocities.set(element.id, { x: 0, y: 0 });
    });
  }

  private calculateForces(
    elements: AppElement[],
    connections: Connection[]
  ): void {
    const forces = new Map<number, Point>();

    elements.forEach((element) => {
      forces.set(element.id, { x: 0, y: 0 });
    });

    for (let i = 0; i < elements.length; i++) {
      for (let j = i + 1; j < elements.length; j++) {
        const force = this.calculateRepulsionForce(elements[i], elements[j]);

        const force1 = forces.get(elements[i].id)!;
        const force2 = forces.get(elements[j].id)!;

        force1.x += force.x;
        force1.y += force.y;
        force2.x -= force.x;
        force2.y -= force.y;
      }
    }

    connections.forEach((connection) => {
      const fromForce = forces.get(connection.from.id);
      const toForce = forces.get(connection.to.id);

      if (fromForce && toForce) {
        const force = this.calculateAttractionForce(
          connection.from,
          connection.to
        );

        fromForce.x += force.x;
        fromForce.y += force.y;
        toForce.x -= force.x;
        toForce.y -= force.y;
      }
    });

    elements.forEach((element) => {
      const force = forces.get(element.id)!;
      const velocity = this.velocities.get(element.id)!;

      const forceMagnitude = Math.sqrt(force.x * force.x + force.y * force.y);
      if (forceMagnitude > this.config.maxForce) {
        force.x = (force.x / forceMagnitude) * this.config.maxForce;
        force.y = (force.y / forceMagnitude) * this.config.maxForce;
      }

      velocity.x = (velocity.x + force.x) * this.config.damping;
      velocity.y = (velocity.y + force.y) * this.config.damping;
    });
  }

  private calculateRepulsionForce(
    element1: AppElement,
    element2: AppElement
  ): Point {
    const dx = element1.centerX - element2.centerX;
    const dy = element1.centerY - element2.centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < this.config.minDistance) {
      const angle = Math.atan2(dy, dx);
      return {
        x:
          (Math.cos(angle) * this.config.repulsionForce) /
          this.config.minDistance,
        y:
          (Math.sin(angle) * this.config.repulsionForce) /
          this.config.minDistance,
      };
    }

    if (distance === 0) {
      return {
        x: Math.random() * 2 - 1,
        y: Math.random() * 2 - 1,
      };
    }

    const force = this.config.repulsionForce / (distance * distance);
    return {
      x: (dx / distance) * force,
      y: (dy / distance) * force,
    };
  }

  private calculateAttractionForce(
    element1: AppElement,
    element2: AppElement
  ): Point {
    const dx = element2.centerX - element1.centerX;
    const dy = element2.centerY - element1.centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance === 0) return { x: 0, y: 0 };

    const displacement = distance - this.config.springLength;
    const force = displacement * this.config.attractionForce;

    return {
      x: (dx / distance) * force,
      y: (dy / distance) * force,
    };
  }

  private updatePositions(elements: AppElement[]): void {
    elements.forEach((element) => {
      const velocity = this.velocities.get(element.id)!;

      const newX = element.centerX + velocity.x;
      const newY = element.centerY + velocity.y;

      element.setCenter(newX, newY);

      if (element.domElement) {
        element.domElement.style.left = `${element.cornerX}px`;
        element.domElement.style.top = `${element.cornerY}px`;
      }
    });
  }

  updateConfig(newConfig: Partial<ForceDirectedConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): ForceDirectedConfig {
    return { ...this.config };
  }

  isLayoutRunning(): boolean {
    return this.isRunning;
  }
}
