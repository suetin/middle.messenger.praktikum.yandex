import '../styles/style.css';
import Button from '../components/Button';
import Input from '../components/Input';
import { renderWithComponents } from '../lib/render';
import loginPageLayout from '../layout/login.hbs?raw';
import { createHandleBlur, validateAndDisplayErrors } from '../lib/validationHandlers';
import type { InputsMap } from '../lib/validationHandlers';

const data = {
  fields: [
    { label: 'Логин', name: 'login', placeholder: 'Введите логин' },
    { label: 'Пароль', name: 'password', type: 'password', placeholder: 'Введите пароль' },
  ],
};

const inputsByName: InputsMap = {};

const handleBlur = createHandleBlur(inputsByName);

const appEl = document.getElementById('app');

if (appEl) {
  const inputComponents = data.fields.reduce<Record<string, Input>>((acc, field) => {
    const input = new Input({
      label: field.label,
      name: field.name,
      type: field.type,
      placeholder: field.placeholder,
      variant: 'underline',
      events: {
        focusout: handleBlur(field.name),
      },
    });
    inputsByName[field.name] = input;
    acc[`field-${field.name}`] = input;
    return acc;
  }, {});

  const button = new Button({
    text: 'Войти',
    fullWidth: true,
    events: {
        click: (event: Event) => {
          event.preventDefault();
          const form = document.getElementById('login-form') as HTMLFormElement | null;
          if (!form) return;
        if (!validateAndDisplayErrors(form, inputsByName)) return;
        const formData = new FormData(form);
        const formValues = Object.fromEntries(formData.entries());
        console.log('login submit', formValues);
      },
    },
  });

  renderWithComponents(
    loginPageLayout,
    data,
    {
      ...inputComponents,
      'login-button': button,
    },
    appEl,
  );
}
