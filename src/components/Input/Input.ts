import Handlebars from 'handlebars';
import Block from '../../lib/Block';
import template from './Input.hbs?raw';

export type InputProps = {
  label?: string;
  name: string;
  type?: string;
  value?: string;
  placeholder?: string;
  error?: string;
  events?: Record<string, EventListener>;
  variant?: 'filled' | 'underline';
  icon?: string;
};

const compile = Handlebars.compile(template);

export default class Input extends Block<InputProps> {
  constructor(props: InputProps) {
    super('div', props);
  }

  render() {
    return compile(this.getViewModel());
  }

  private getViewModel() {
    const { variant = 'underline', type, icon, ...rest } = this.props;
    return {
      ...rest,
      variant,
      isFilled: variant === 'filled',
      inputType: type ?? 'text',
      icon,
    };
  }

  get value(): string {
    const input = this.element?.querySelector('input') as HTMLInputElement | null;
    return input?.value ?? '';
  }

  setValue(value: string) {
    const input = this.element?.querySelector('input') as HTMLInputElement | null;
    if (input) {
      input.value = value;
    }
  }

  focusInput() {
    const input = this.element?.querySelector('input') as HTMLInputElement | null;
    input?.focus();
  }
}
