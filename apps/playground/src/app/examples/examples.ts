export const exampleFiles: Record<string, string> = {
  basic: `import { Component, Prop, Computed, State } from '@pryzm/core';

@Component({
  selector: 'app-todo',
  styles: \`
* {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
}

button {
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: 10px 8px;
  width: 150px;
  height: 40px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0) 100%), #375DFB;
  box-shadow: 0px 1px 2px rgba(37, 62, 167, 0.48), 0px 0px 0px 1px #375DFB;
  border-radius: 10px;
  border: none;
  font-weight: 500;
  font-size: 14px;
  line-height: 20px;
  text-align: center;
  letter-spacing: -0.006em;
  font-feature-settings: 'cv09' on, 'ss11' on, 'calt' off, 'liga' off;
  color: #FFFFFF;
}

input {
  box-sizing: border-box;
  padding: 10px 10px 10px 12px;
  width: 352px;
  height: 40px;
  background: #FFFFFF;
  border: 1px solid #E2E4E9;
  box-shadow: 0px 1px 2px rgba(228, 229, 231, 0.24);
  border-radius: 10px;
  margin-bottom: 1rem;
}\`
})
export class App {

  @State() todos: string[] = []
  @State() text: string = '';

  private onChange(event: Event): void {
    this.text = event.target.value;
  }

  private addTodo(): void {
    this.todos = [...this.todos, this.text];
    this.text = '';
  }

  render() {
    return <>
      <input type="text" placeholder="Enter a todo" value={this.text} onChange={this.onChange} />
      <button onClick={this.addTodo}>Add Todo</button>

      <ul>
        <For each={this.todos}>
          {todo => <li>{todo}</li>}
        </For>
      </ul>
    </>
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
import clsx from 'clsx';

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
  conditionalStyles: `import { Component, State } from '@pryzm/core';

@Component()
export class App {

  @State() private show = true;

  private toggle() {
    this.show = !this.show;
  }

  render() {
    return <div>
      <button onClick={this.toggle}>Toggle</button>
      <div style={{
        display: this.show ? 'block' : 'none'
      }}>Hello World!</div>
    </div>
  }
}`,
  providers: `import { Component, State, Inject } from '@pryzm/core';

class MessageService {
  message = 'Hello Pryzm!';
}

@Component({
  providers: [
    MessageService
  ]
})
export class App {

    @Inject() private readonly service: MessageService;

    render() {
      return <h2>{this.service.message}</h2>
    }
  }`,
};
