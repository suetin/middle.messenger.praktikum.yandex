import '../styles/style.css';
import '../styles/profile.css';
import Handlebars from 'handlebars';
import profileLayoutTemplate from '../layout/profilePassword.hbs?raw';
import backToTemplate from '../partials/backTo.hbs?raw';
import avatarFormTemplate from '../partials/avatarForm.hbs?raw';
import { renderWithComponents } from '../lib/render';
import Input from '../components/Input';
import Button from '../components/Button';

Handlebars.registerPartial('back-to', backToTemplate);
Handlebars.registerPartial('avatar-form', avatarFormTemplate);

const data = {
  avatar: 'https://i.pravatar.cc/180?img=8',
  name: 'Иван',
  fields: [
    { label: 'Старый пароль', name: 'oldPassword', type: 'password', value: '111' },
    { label: 'Новый пароль', name: 'newPassword', type: 'password', value: '111' },
    { label: 'Повторите новый пароль', name: 'newPasswordRepeat', type: 'password', value: '111' },
  ],
};

const appEl = document.getElementById('app');
if (appEl) {
  const inputComponents = data.fields.reduce<Record<string, Input>>((acc, field) => {
    acc[`field-${field.name}`] = new Input({
      label: field.label,
      name: field.name,
      type: field.type,
      value: field.value,
      variant: 'underline',
    });
    return acc;
  }, {});

  const savePasswordButton = new Button({
    text: 'Сохранить',
    events: {
      click: (event: Event) => {
        event.preventDefault();
        const form = document.getElementById('password-form') as HTMLFormElement | null;
        if (!form) return;
        const formData = new FormData(form);
        console.log('password save', Object.fromEntries(formData.entries()));
      },
    },
  });

  renderWithComponents(
    profileLayoutTemplate,
    data,
    {
      ...inputComponents,
      'save-password-button': savePasswordButton,
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
