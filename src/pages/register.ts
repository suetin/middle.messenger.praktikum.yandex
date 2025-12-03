import '../styles/style.css';
import registerLayoutTemplate from '../layout/register.hbs?raw';
import { renderWithComponents } from '../lib/render';
import Input from '../components/Input';
import Button from '../components/Button';

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

const appEl = document.getElementById('app');
if (appEl) {
  const inputComponents = data.fields.reduce<Record<string, Input>>((acc, field) => {
    acc[`field-${field.name}`] = new Input({
      label: field.label,
      name: field.name,
      type: field.type,
      variant: 'underline',
    });
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
