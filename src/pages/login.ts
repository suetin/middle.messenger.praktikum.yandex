import '../styles/style.css';
import Button from '../components/Button';
import Input from '../components/Input';
import { renderWithComponents } from '../lib/render';
import loginPageLayout from '../layout/login.hbs?raw';

const data = {
  fields: [
    { label: 'Логин', name: 'login', placeholder: 'Введите логин' },
    { label: 'Пароль', name: 'password', type: 'password', placeholder: 'Введите пароль' },
  ],
};

const appEl = document.getElementById('app');

if (appEl) {
  const inputComponents = data.fields.reduce<Record<string, Input>>((acc, field) => {
    acc[`field-${field.name}`] = new Input({
      label: field.label,
      name: field.name,
      type: field.type,
      placeholder: field.placeholder,
      variant: 'underline',
    });
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
