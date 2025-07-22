import { AppElement } from "./AppElement.ts";
import { ConnectionData } from "../types.ts";

export class Connection {
  id: string;
  from: AppElement;
  to: AppElement;

  constructor(from: AppElement, to: AppElement) {
    this.id = (Date.now() + Math.random()).toString();
    this.from = from;
    this.to = to;

    from.connections.push(this);
    to.connections.push(this);
  }

  serialize(): ConnectionData {
    return {
      id: this.id,
      from: this.from.id,
      to: this.to.id,
    };
  }
}
