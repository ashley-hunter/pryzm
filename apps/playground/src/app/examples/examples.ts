export const exampleFiles: Record<string, string> = {
  basic: `import { Component, Prop, Computed, State } from '@pryzm/core';

@Component()
export class App {

  @Prop() readonly firstName = "John";
  @Prop() readonly lastName = "Smith";

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
  refs: `import { Component, Prop, Computed, State } from '@pryzm/core';

@Component()
export class App {

  @Ref() readonly elementRef: HTMLElement;

  private randomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';

    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }

  private changeColor() {
    this.elementRef.style.backgroundColor = this.randomColor();
  }

  render() {
    return <button ref={this.elementRef} onClick={this.changeColor}>
      Click Me to change color
    </button>
  }

}`,
  templateRefs: `import { Component, Prop, Computed, State } from '@pryzm/core';

@Component()
export class App {

  private showAlert() {
    alert('Hello World!');
  }

  render() {
    return <button onClick={this.showAlert}>
      Click Me
    </button>
  }

}`,
  lifecycle: `import { Component, State } from '@pryzm/core';

@Component()
export class App {

  @State() private intervalId: any;

  onInit() {
    this.intervalId = setInterval(() => {
      console.log('Hello World!');
    }, 1000);
  }

  onDestroy() {
    clearInterval(this.intervalId);
  }

  render() {
    return <div>Check the console</div>
  }

}`,
  conditionalShow: `import { Component, State, Show } from '@pryzm/core';

@Component()
export class App {

    @State() private show = true;

    private toggle() {
      this.show = !this.show;
    }

    render() {
      return <div>
        <button onClick={this.toggle}>Toggle</button>
        <Show when={this.show} fallback={<div>Hiding</div>}>
          <div>Showing</div>
        </Show>
      </div>
    }
  }`,
  loops: `import { Component, State, For } from '@pryzm/core';

@Component()
export class App {

    @State() private items = [1, 2, 3, 4, 5];

    render() {
      return <div>
        <For each={this.items}>
          {item => <div>{item}</div>}
        </For>
      </div>
    }
  }`,
  keyedLoops: `import { Component, State, For } from '@pryzm/core';

@Component()
export class App {

    @State() private items = [1, 2, 3, 4, 5];

    render() {
      return <div>
        <For each={this.items}>
          {(item, index) => <div key={index}>{item}</div>}
        </For>
      </div>
    }
  }`,
  slot: `import { Component, State, Slot } from '@pryzm/core';

@Component()
export class App {

  render() {
    return <div>
      <slot />
    </div>
  }
}`,
  namedSlots: `import { Component, State, Slot } from '@pryzm/core';

@Component()
export class App {

  render() {
    return <div>
      <slot name="header" />
      <slot name="content" />
      <slot name="footer" />
    </div>
  }
}`,
  conditionalClasses: `import { Component, State } from '@pryzm/core';

    @Component({
      styles: \`
        .show {
          display: block;
        }
        .hide {
          display: none;
        }
      \`
    })
    export class App {

        @State() private show = true;

        private toggle() {
          this.show = !this.show;
        }

        render() {
          return <div>
            <button onClick={this.toggle}>Toggle</button>
            <div class={{
              show: this.show,
              hide: !this.show
            }}>Hello World!</div>
          </div>
        }
      }`,
};
