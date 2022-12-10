import { Component, Prop, Renderable } from '@emblazon/core';

@Component()
export class Button implements Renderable {
  @Prop() readonly label = 'Click me!';

  render() {
    return <button>Click me!</button>;
  }
}
