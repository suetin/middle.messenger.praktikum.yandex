import Handlebars from 'handlebars';
import profileLayoutTemplate from '../layout/profileEdit.hbs?raw';
import backToTemplate from '../partials/backTo.hbs?raw';
import avatarFormTemplate from '../partials/avatarForm.hbs?raw';
import Block from '../lib/Block';
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

export default class ProfileEditPage extends Block {
  private _inputsByName: InputsMap = {};
  private _components: Record<string, Input | Button> = {};
  private _componentsInitialized = false;

  private _initComponents() {
    if (this._componentsInitialized) {
      return;
    }
    if (!this._inputsByName) {
      this._inputsByName = {};
    }
    const inputsByName = this._inputsByName;
    const handleBlur = createHandleBlur(inputsByName);

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

    this._components = {
      ...inputComponents,
      'save-profile-button': saveProfileButton,
    };
    this._componentsInitialized = true;
  }

  render() {
    this._initComponents();
    const root = document.createElement('div');
    renderWithComponents(profileLayoutTemplate, data, this._components, root);
    const firstChild = root.firstElementChild;
    return firstChild instanceof HTMLElement ? firstChild : root;
  }

  componentDidMount() {
    const root = this.getContent();
    const avatarOpenForm = root.querySelector('.js-avatar-form, .js-avatar-open-form');
    const avatarModal = root.querySelector('.js-avatar-modal');

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
  }
}
