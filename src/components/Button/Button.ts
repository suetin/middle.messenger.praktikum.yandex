import Handlebars from 'handlebars';
import Block from '../../lib/Block';
import template from './Button.hbs?raw';

type Props = {
  text: string;
  fullWidth?: boolean;
  events?: Record<string, (event: Event) => void>;
};

const compile = Handlebars.compile(template);

export default class Button extends Block<Props> {
  constructor(props: Props) {
    super('button', props);
  }

  render() {
    return compile(this.props);
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
