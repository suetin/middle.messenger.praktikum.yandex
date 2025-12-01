import Block from '../../lib/Block';

export type InputProps = {
  label?: string;
  name: string;
  type?: string;
  value?: string;
  placeholder?: string;
  error?: string;
  events?: Record<string, EventListener>;
};

export default class Input extends Block<InputProps> {
  constructor(props: InputProps) {
    super('div', props);
  }

  render() {
    const { label, name, type = 'text', value = '', placeholder = '', error } = this.props;
    const errorClass = error ? ' input-group--error' : '';
    const valueAttr = value ? ` value="${value}"` : '';
    const placeholderAttr = placeholder ? ` placeholder="${placeholder}"` : '';

    return `
      <div class="input-group${errorClass}">
        ${label ? `<label for="${name}">${label}</label>` : ''}
        <input id="${name}" name="${name}" type="${type}"${valueAttr}${placeholderAttr} />
        <span class="underline"></span>
        ${error ? `<span class="input-group__error">${error}</span>` : ''}
      </div>
    `;
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
