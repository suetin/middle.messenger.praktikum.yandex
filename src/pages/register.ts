import '../styles/style.css';
import registerLayoutTemplate from '../layout/register.hbs?raw';
import { renderWithComponents } from '../lib/render';
import Input from '../components/Input';
import Button from '../components/Button';
import { createHandleBlur, validateAndDisplayErrors } from '../lib/validationHandlers';
import type { InputsMap } from '../lib/validationHandlers';

const data = {
  fields: [
    { label: 'Имя', name: 'first_name', type: 'text' },
    { label: 'Фамилия', name: 'second_name', type: 'text' },
    { label: 'Логин', name: 'login', type: 'text' },
    { label: 'Почта', name: 'email', type: 'text' },
    { label: 'Пароль', name: 'password', type: 'password' },
    { label: 'Телефон', name: 'phone', type: 'text' },
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
      variant: 'underline',
      events: {
        focusout: handleBlur(field.name),
      },
    });
    inputsByName[field.name] = input;
    acc[`field-${field.name}`] = input;
    return acc;
  }, {});

  const registerButton = new Button({
    text: 'Зарегистрироваться',
    fullWidth: true,
    events: {
      click: (event: Event) => {
        event.preventDefault();
        const form = document.getElementById('register-form') as HTMLFormElement | null;
        if (!form) return;
        if (!validateAndDisplayErrors(form, inputsByName)) return;
        const formData = new FormData(form);
        console.log('register submit', Object.fromEntries(formData.entries()));
      },
    },
  });

  renderWithComponents(
    registerLayoutTemplate,
    data,
    {
      ...inputComponents,
      'register-button': registerButton,
    },
    appEl,
  );
}
