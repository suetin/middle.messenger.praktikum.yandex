import EventBus from './EventBus';

export type BlockProps = Record<string, unknown>;

type BlockMeta<P extends BlockProps> = {
  tagName: string;
  props: P;
};

export default class Block<P extends BlockProps = BlockProps> {
  static EVENTS = {
    INIT: 'init',
    FLOW_CDM: 'flow:component-did-mount',
    FLOW_CDU: 'flow:component-did-update',
    FLOW_RENDER: 'flow:render',
  } as const;

  private _id: string = Math.random().toString(16).slice(2);
  private _element: HTMLElement | null = null;
  private _meta: BlockMeta<P> | null = null;
  private _events: Record<string, EventListener> = {};

  props: P;
  eventBus: () => EventBus;

  constructor(tagName: string = 'div', props = {} as P) {
    const eventBus = new EventBus();
    this._meta = {
      tagName,
      props,
    };

    this.props = this._makePropsProxy(props);
    this.eventBus = () => eventBus;

    this._registerEvents(eventBus);
    eventBus.emit(Block.EVENTS.INIT);
  }

  private _registerEvents(eventBus: EventBus) {
    eventBus.on(Block.EVENTS.INIT, this.init.bind(this));
    eventBus.on(Block.EVENTS.FLOW_CDM, this._componentDidMount.bind(this));
    eventBus.on(Block.EVENTS.FLOW_CDU, this._componentDidUpdate.bind(this));
    eventBus.on(Block.EVENTS.FLOW_RENDER, this._render.bind(this));
  }

  private _createResources() {
    const { tagName } = this._meta || {};
    if (!tagName) {
      throw new Error('Block meta is not initialized');
    }
    this._element = this._createDocumentElement(tagName);
  }

  init() {
    this._createResources();
    this.eventBus().emit(Block.EVENTS.FLOW_RENDER);
  }

  private _componentDidMount() {
    this.componentDidMount();
  }

  // eslint-disable-next-line
  componentDidMount(oldProps?: P) {}

  dispatchComponentDidMount() {
    this.eventBus().emit(Block.EVENTS.FLOW_CDM);
  }

  private _componentDidUpdate(oldProps: P, newProps: P) {
    const response = this.componentDidUpdate(oldProps, newProps);
    if (!response) {
      return;
    }
    this._render();
  }

  // eslint-disable-next-line
  componentDidUpdate(oldProps: P, newProps: P) {
    return true;
  }

  setProps = (nextProps?: Partial<P>) => {
    if (!nextProps) {
      return;
    }

    Object.assign(this.props, nextProps);
  };

  get element(): HTMLElement | null {
    return this._element;
  }

  get id(): string {
    return this._id;
  }

  protected _render() {
    const block = this.render();
    if (!this._element) {
      return;
    }

    this._removeEvents();

    // Этот небезопасный метод для упрощения логики
    // Используйте шаблонизатор из npm или напишите свой безопасный
    // Нужно не в строку компилировать (или делать это правильно),
    // либо сразу в DOM-элементы возвращать из compile DOM-ноду
    if (typeof block === 'string') {
      this._element.innerHTML = block;
    } else if (block instanceof DocumentFragment) {
      this._element.innerHTML = '';
      this._element.appendChild(block);
    }

    this._addEvents();
  }

  // Потомки возвращают строку или готовый DOM-фрагмент (View перекрывает _render)

  render(): string | DocumentFragment | null | undefined {
    return '';
  }

  getContent(): HTMLElement {
    if (!this._element) {
      throw new Error('Element is not created yet');
    }
    return this._element;
  }

  private _makePropsProxy(props: P): P {
    return new Proxy(props, {
      get: (target: P, prop: string | symbol) => {
        const value = target[prop as keyof P];
        return typeof value === 'function' ? value.bind(target) : value;
      },
      set: (target: P, prop: string | symbol, value: unknown) => {
        Reflect.set(target as Record<PropertyKey, unknown>, prop, value);
        // Запускаем обновление компоненты
        // Плохой cloneDeep, в следующей итерации нужно заставлять добавлять cloneDeep им самим
        this.eventBus().emit(Block.EVENTS.FLOW_CDU, { ...target }, target);
        return true;
      },
      deleteProperty() {
        throw new Error('Нет доступа');
      },
    });
  }

  private _createDocumentElement(tagName: string) {
    // Можно сделать метод, который через фрагменты в цикле создаёт сразу несколько блоков
    return document.createElement(tagName);
  }

  show() {
    this.getContent().style.display = 'block';
  }

  hide() {
    this.getContent().style.display = 'none';
  }

  destroy() {
    this._removeEvents();
    this._element?.remove();
    this._element = null;
  }

  mount(parent: HTMLElement) {
    parent.appendChild(this.getContent());
    this.dispatchComponentDidMount();
  }

  private _getEventProps() {
    const { events } = this.props as P & { events?: Record<string, EventListener> };
    return events;
  }

  private _addEvents() {
    if (!this._element) return;
    const events = this._getEventProps();
    if (!events) return;

    Object.entries(events).forEach(([event, listener]) => {
      this._events[event] = listener;
      this._element?.addEventListener(event, listener);
    });
  }

  private _removeEvents() {
    if (!this._element) return;

    Object.entries(this._events).forEach(([event, listener]) => {
      this._element?.removeEventListener(event, listener);
    });
    this._events = {};
  }
}
