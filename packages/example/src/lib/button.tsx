import { Component, Prop, Renderable } from '@pryzm/core';

@Component()
export class Button implements Renderable {
  @Prop() readonly label = 'Click me!';

  render() {
    return <button>Click me!</button>;
  }
}
