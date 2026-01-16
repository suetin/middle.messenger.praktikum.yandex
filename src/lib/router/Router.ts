import Route from './Route';
import type Block from '../Block';
import type { BlockProps } from '../Block';

type BlockConstructor = new (tagName?: string, props?: BlockProps) => Block;

type RouterOptions = {
  rootQuery: string;
};

export default class Router {
  private static __instance: Router | null = null;
  private routes: Route[] = [];
  private history: History = window.history;
  private _currentRoute: Route | null = null;
  private _rootQuery: string;
  private _fallbackRoute: Route | null = null;

  constructor(rootQuery: string | RouterOptions) {
    if (Router.__instance) {
      return Router.__instance;
    }

    const options = typeof rootQuery === 'string' ? { rootQuery } : rootQuery;
    this._rootQuery = options.rootQuery;

    Router.__instance = this;
  }

  use(pathname: string, block: BlockConstructor) {
    const route = new Route(pathname, block, { rootQuery: this._rootQuery });

    this.routes.push(route);
    if (pathname === '*') {
      this._fallbackRoute = route;
    }

    return this;
  }

  start() {
    window.onpopstate = (event) => {
      const target = event.currentTarget as Window | null;
      const pathname = target?.location?.pathname ?? window.location.pathname;
      this._onRoute(this._normalizePathname(pathname));
    };

    document.addEventListener('click', this._handleLinkClick);

    this._onRoute(this._normalizePathname(window.location.pathname));
  }

  go(pathname: string) {
    const normalized = this._normalizePathname(pathname);
    this.history.pushState({}, '', normalized);
    this._onRoute(normalized);
  }

  back() {
    this.history.back();
  }

  forward() {
    this.history.forward();
  }

  getRoute(pathname: string) {
    const route = this.routes.find((item) => item.match(pathname).matched);
    return route ?? this._fallbackRoute;
  }

  private _onRoute(pathname: string) {
    const normalized = this._normalizePathname(pathname);
    const route = this.getRoute(normalized);
    if (!route) {
      return;
    }

    if (this._currentRoute && this._currentRoute !== route) {
      this._currentRoute.leave();
    }

    this._currentRoute = route;
    route.navigate(normalized);
  }

  private _handleLinkClick = (event: MouseEvent) => {
    if (event.defaultPrevented) {
      return;
    }

    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }

    const target = event.target as HTMLElement | null;
    const backButton = target?.closest('[data-back]');
    if (backButton) {
      event.preventDefault();
      this.back();
      return;
    }

    const anchor = target?.closest('a');
    if (!anchor) {
      return;
    }

    if (anchor.target && anchor.target !== '_self') {
      return;
    }

    if (anchor.hasAttribute('download')) {
      return;
    }

    const href = anchor.getAttribute('href');
    if (!href || href.startsWith('#')) {
      return;
    }

    const url = new URL(href, window.location.origin);
    if (url.origin !== window.location.origin) {
      return;
    }

    event.preventDefault();
    this.go(url.pathname);
  };

  private _normalizePathname(pathname: string) {
    if (pathname.endsWith('.html')) {
      const normalized = pathname.replace(/\\.html$/, '');
      return normalized === '' ? '/' : normalized;
    }
    return pathname;
  }
}
