import Handlebars from 'handlebars';
import Block from './Block';

type ComponentsMap = Record<string, Block>;

export function renderWithComponents(
  template: string,
  context: Record<string, unknown>,
  components: ComponentsMap,
  root: HTMLElement,
) {
  const html = Handlebars.compile(template)(context);
  root.innerHTML = html;

  Object.entries(components).forEach(([id, block]) => {
    const host = root.querySelector(`[data-component="${id}"]`);
    if (host instanceof HTMLElement) {
      block.mount(host);
    }
  });
}
