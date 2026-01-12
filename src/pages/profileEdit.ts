import '../styles/style.css';
import '../styles/profile.css';
import Handlebars from 'handlebars';
import profileLayoutTemplate from '../layout/profileEdit.hbs?raw';
import backToTemplate from '../partials/backTo.hbs?raw';
import avatarFormTemplate from '../partials/avatarForm.hbs?raw';
import { renderWithComponents } from '../lib/render';
import Input from '../components/Input';
import Button from '../components/Button';
import { createHandleBlur, validateAndDisplayErrors } from '../lib/validationHandlers';
import type { InputsMap } from '../lib/validationHandlers';

Handlebars.registerPartial('back-to', backToTemplate);
Handlebars.registerPartial('avatar-form', avatarFormTemplate);

const data = {
  avatar: 'https://i.pravatar.cc/180?img=8',
  name: 'Иван',
  fields: [
    { label: 'Почта', name: 'email', value: 'pochta@yandex.ru', type: 'text' },
    { label: 'Логин', name: 'login', value: 'ivanivanov', type: 'text' },
    { label: 'Имя', name: 'first_name', value: 'Иван', type: 'text' },
    { label: 'Фамилия', name: 'second_name', value: 'Иванов', type: 'text' },
    { label: 'Имя в чате', name: 'display_name', value: 'Иван', type: 'text' },
    { label: 'Телефон', name: 'phone', value: '+79099673030', type: 'text' },
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
      value: field.value,
      variant: 'underline',
      events: {
        focusout: handleBlur(field.name),
      },
    });
    inputsByName[field.name] = input;
    acc[`field-${field.name}`] = input;
    return acc;
  }, {});

  const saveProfileButton = new Button({
    text: 'Сохранить',
    events: {
      click: (event: Event) => {
        event.preventDefault();
        const form = document.getElementById('profile-form') as HTMLFormElement | null;
        if (!form) return;
        if (!validateAndDisplayErrors(form, inputsByName)) return;
        const formData = new FormData(form);
        console.log('profile save', Object.fromEntries(formData.entries()));
      },
    },
  });

  renderWithComponents(
    profileLayoutTemplate,
    data,
    {
      ...inputComponents,
      'save-profile-button': saveProfileButton,
    },
    appEl,
  );
}

const avatarOpenForm = document.querySelector('.js-avatar-form, .js-avatar-open-form');
const avatarModal = document.querySelector('.js-avatar-modal');

if (avatarOpenForm && avatarModal) {
  avatarOpenForm.addEventListener('click', () => {
    avatarModal.classList.toggle('avatar-modal--open');
  });

  avatarModal.addEventListener('click', (event) => {
    if (event.target === avatarModal) {
      avatarModal.classList.remove('avatar-modal--open');
    }
  });
}
