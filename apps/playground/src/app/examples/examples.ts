export const exampleFiles: Record<string, string> = {
  basic: `import { Component, Prop, Computed, State } from '@pryzm/core';

  @Component()
  export class App {

    @Prop() readonly firstName = "John";
    @Prop() readonly lastName = "Smith";

    @State() counter: number = 10;

    @Computed() get fullName() {
      return this.firstName + ' ' + this.lastName;
    }

    render() {
      return <div>{this.fullName}</div>
    }

  }`,
  events: `import { Component, Event, EventEmitter } from '@pryzm/core';

  @Component({
    selector: 'uxa-button'
  })
  export class App {

    @Event() readonly onSelect = new EventEmitter<boolean>();

    private onClick() {
      this.onSelect.emit(10);
    }

    render() {
      return <button onClick={this.onClick}>Click Me</button>
    }

  }`,
};