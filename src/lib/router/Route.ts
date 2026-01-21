import Block, { type BlockProps } from '../Block';

export type RouteParams = Record<string, string>;

type RouteProps = {
  rootQuery: string;
};

type BlockConstructor = new (tagName?: string, props?: BlockProps) => Block;

type RouteMatch = {
  matched: boolean;
  params: RouteParams;
};

export default class Route {
  private _pathname: string;
  private _currentPathname: string;
  private _blockClass: BlockConstructor;
  private _block: Block | null = null;
  private _props: RouteProps;
  private _keys: string[] = [];
  private _regexp: RegExp;
  private _params: RouteParams = {};

  constructor(pathname: string, view: BlockConstructor, props: RouteProps) {
    this._pathname = pathname;
    this._currentPathname = pathname;
    this._blockClass = view;
    this._props = props;
    this._regexp = this._createRegexp(pathname);
  }

  navigate(pathname: string) {
    const match = this.match(pathname);
    if (match.matched) {
      this._currentPathname = pathname;
      this._params = match.params;
      this.render();
    }
  }

  leave() {
    if (this._block) {
      this._block.destroy();
      this._block = null;
    }
  }

  match(pathname: string): RouteMatch {
    if (this._pathname === '*') {
      return { matched: true, params: {} };
    }

    const match = pathname.match(this._regexp);
    if (!match) {
      return { matched: false, params: {} };
    }

    const params = this._keys.reduce<RouteParams>((acc, key, index) => {
      acc[key] = match[index + 1];
      return acc;
    }, {});

    return { matched: true, params };
  }

  render() {
    if (!this._block) {
      this._block = new this._blockClass('div', {
        params: this._params,
        pathname: this._currentPathname,
      });
      const root = document.querySelector(this._props.rootQuery);
      if (!root) {
        throw new Error(`Root element not found: ${this._props.rootQuery}`);
      }
      this._block.mount(root as HTMLElement);
      return;
    }

    const currentProps = this._block.props as { params?: RouteParams; pathname?: string };
    const shouldUpdate =
      !this._isSameParams(currentProps.params ?? {}, this._params) ||
      currentProps.pathname !== this._currentPathname;
    if (shouldUpdate) {
      this._block.setProps({
        params: this._params,
        pathname: this._currentPathname,
      });
    }
    this._block.show();
  }

  get pathname() {
    return this._pathname;
  }

  private _createRegexp(pathname: string) {
    if (pathname === '*') {
      return /.*/;
    }

    if (pathname === '/') {
      return /^\/$/;
    }

    const parts = pathname.split('/').filter(Boolean);
    const pattern = parts
      .map((part) => {
        const paramMatch = part.match(/^\{(.+)\}$/);
        if (paramMatch) {
          const key = paramMatch[1];
          this._keys.push(key);
          return '([^/]+)';
        }
        return part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      })
      .join('/');

    return new RegExp(`^/${pattern}/?$`);
  }

  private _isSameParams(left: RouteParams, right: RouteParams) {
    const leftKeys = Object.keys(left);
    const rightKeys = Object.keys(right);
    if (leftKeys.length !== rightKeys.length) {
      return false;
    }
    return leftKeys.every((key) => left[key] === right[key]);
  }
}
