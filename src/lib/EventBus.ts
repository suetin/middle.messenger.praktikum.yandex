// eslint-disable-next-line
type EventCallback = (...args: any[]) => void;
type Listeners = Record<string, EventCallback[]>;

export default class EventBus {
  private listeners: Listeners;

  constructor() {
    this.listeners = {};
  }

  on(event: string, callback: EventCallback): void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }

    this.listeners[event].push(callback);
  }

  off(event: string, callback: EventCallback): void {
    const callbacks = this.listeners[event];
    if (!callbacks) {
      throw new Error(`Нет события: ${event}`);
    }

    this.listeners[event] = callbacks.filter((listener) => listener !== callback);
  }

  emit(event: string, ...args: unknown[]): void {
    const callbacks = this.listeners[event];
    if (!callbacks) {
      throw new Error(`Нет события: ${event}`);
    }

    callbacks.forEach((listener) => {
      listener(...args);
    });
  }
}
