import { Element } from "./Element.ts";
import { ConnectionData } from "../types.ts";

export class Connection {
  public id: number;
  public from: Element;
  public to: Element;

  constructor(from: Element, to: Element) {
    this.id = Date.now() + Math.random();
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
