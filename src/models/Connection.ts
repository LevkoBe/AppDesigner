import { AppElement } from "./Element.ts";
import { ConnectionData } from "../types.ts";

export class Connection {
  public id: string;
  public from: AppElement;
  public to: AppElement;

  constructor(from: AppElement, to: AppElement) {
    this.id = (Date.now() + Math.random()).toString();
    this.from = from;
    this.to = to;

    from.connections.push(this);
    to.connections.push(this);
  }

  public serialize(): ConnectionData {
    return {
      id: this.id,
      from: this.from.id,
      to: this.to.id,
    };
  }
}
