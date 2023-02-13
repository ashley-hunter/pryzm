import { Component, Computed, Event, Prop, Provider, Ref, State } from './decorators';
import { EventEmitter } from './types';

const MyServiceToken = Symbol('MyService');

@Component()
export class Button {
  @Prop() public type: string;

  @State() private isDisabled = false;

  @Ref() private button: HTMLButtonElement;

  @Computed() get isPrimary() {
    return this.type === 'primary';
  }

  @Event() public onClick = new EventEmitter();

  @Provider(MyServiceToken) readonly service = new SomeService();

  render() {
    return (
      <button ref={this.button} disabled={this.isDisabled} onClick={this.onClick.emit()}>
        {this.isPrimary ? 'Primary' : 'Secondary'}
      </button>
    );
  }
}

class SomeService {}
