import Handlebars from 'handlebars';
import Block from '../../lib/Block';
import template from './Button.hbs?raw';

type Props = {
  text?: string;
  icon?: string; // путь до картинки или иконки
  ariaLabel?: string;
  variant?: 'default' | 'icon';
  fullWidth?: boolean;
  className?: string;
  events?: Record<string, (event: Event) => void>;
};

const compile = Handlebars.compile(template);

export default class Button extends Block<Props> {
  constructor(props: Props) {
    super('button', props);
  }

  render() {
    const html = compile(this.getViewModel()).trim();
    const tpl = document.createElement('template');
    tpl.innerHTML = html;
    const element = tpl.content.firstElementChild;
    if (!(element instanceof HTMLElement)) {
      return '';
    }
    return element;
  }

  private getViewModel() {
    const { text, icon, variant, ariaLabel, ...rest } = this.props;
    const iconHtml = icon ? `<img src="${icon}" alt="${ariaLabel ?? ''}" />` : null;
    const content = iconHtml ?? text ?? '';
    const isIcon = variant === 'icon' || (!!icon && !text);
    return {
      ...rest,
      content,
      isIcon,
      ariaLabel,
    };
  }

  componentDidMount() {
    console.log('Button did mount');
  }

  componentDidUpdate(oldProps: Props, newProps: Props) {
    console.log('Button did update', oldProps, newProps);
    // Разрешаем перерендер
    return true;
  }
}
