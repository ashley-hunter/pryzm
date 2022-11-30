export class EventEmitter<T = void> {
  /**
   * Emit a value that a parent component can listen to.
   * @param value The value to emit.
   */
  emit(value?: T): void {}
}
