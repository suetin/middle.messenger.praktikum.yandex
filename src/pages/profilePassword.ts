import Handlebars from 'handlebars';
import profileLayoutTemplate from '../layout/profilePassword.hbs?raw';
import backToTemplate from '../partials/backTo.hbs?raw';
import avatarFormTemplate from '../partials/avatarForm.hbs?raw';
import Block from '../lib/Block';
import { renderWithComponents } from '../lib/render';
import Input from '../components/Input';
import Button from '../components/Button';
import { createHandleBlur, validateAndDisplayErrors } from '../lib/validationHandlers';
import type { InputsMap } from '../lib/validationHandlers';
import { getUser, updatePassword } from '../api/user';
import { handleAuthResponse } from '../lib/apiGuard';
import Router from '../lib/router/Router';
import { bindAvatarModal } from '../lib/avatarModal';
import { BASE_URL } from '../api/base';
import { getResourceUrl } from '../lib/resourceUrl';

Handlebars.registerPartial('back-to', backToTemplate);
Handlebars.registerPartial('avatar-form', avatarFormTemplate);

type UserProfile = {
  id: number;
  first_name: string;
  second_name: string;
  display_name: string | null;
  avatar: string | null;
};

const DEFAULT_AVATAR = '/avatar.png';

const data = {
  avatar: DEFAULT_AVATAR,
  name: 'Пользователь',
  fields: [
    { label: 'Старый пароль', name: 'oldPassword', type: 'password', value: '' },
    { label: 'Новый пароль', name: 'newPassword', type: 'password', value: '' },
    { label: 'Повторите новый пароль', name: 'newPasswordRepeat', type: 'password', value: '' },
  ],
};

function getUserName(user: UserProfile) {
  const displayName = user.display_name?.trim();
  if (displayName) {
    return displayName;
  }
  return `${user.first_name} ${user.second_name}`.trim();
}

function getAvatarUrl(avatar: string | null) {
  return avatar ? getResourceUrl(BASE_URL, avatar) : DEFAULT_AVATAR;
}

export default class ProfilePasswordPage extends Block {
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

    const savePasswordButton = new Button({
      text: 'Сохранить',
      events: {
        click: async (event: Event) => {
          event.preventDefault();
          const form = document.getElementById('password-form') as HTMLFormElement | null;
          if (!form) return;
          if (!validateAndDisplayErrors(form, inputsByName)) return;
          const formData = new FormData(form);
          const oldPassword = String(formData.get('oldPassword') ?? '');
          const newPassword = String(formData.get('newPassword') ?? '');
          const newPasswordRepeat = String(formData.get('newPasswordRepeat') ?? '');

          if (newPassword !== newPasswordRepeat) {
            inputsByName.newPasswordRepeat?.setProps({
              value: newPasswordRepeat,
              error: 'Пароли не совпадают',
            });
            return;
          }

          try {
            const response = await updatePassword({ oldPassword, newPassword });
            if (handleAuthResponse(response)) {
              return;
            }
            if (response.status < 200 || response.status >= 300) {
              console.error('update password error', response.status, response.responseText);
              return;
            }
            const router = new Router('#app');
            router.go('/settings');
          } catch (error) {
            console.error('update password request failed', error);
          }
        },
      },
    });

    this._components = {
      ...inputComponents,
      'save-password-button': savePasswordButton,
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
    bindAvatarModal(root, (avatarUrl) => this._updateAvatar(avatarUrl));
    this._loadUser();
  }

  private _updateAvatar(avatarUrl: string) {
    const root = this.getContent();
    const avatar = root.querySelector('.profile__top img');
    if (avatar instanceof HTMLImageElement) {
      avatar.src = avatarUrl;
    }
  }

  private _applyUser(user: UserProfile) {
    const root = this.getContent();
    const name = getUserName(user);
    const nameEl = root.querySelector('.profile__name');
    if (nameEl) {
      nameEl.textContent = name;
    }
    const avatar = root.querySelector('.profile__top img');
    if (avatar instanceof HTMLImageElement) {
      avatar.src = getAvatarUrl(user.avatar);
      avatar.alt = `Аватар ${name}`;
    }
  }

  private async _loadUser() {
    try {
      const response = await getUser();
      if (handleAuthResponse(response)) {
        return;
      }
      if (response.status < 200 || response.status >= 300) {
        console.error('get user error', response.status, response.responseText);
        return;
      }
      const data = JSON.parse(response.responseText || '{}') as UserProfile;
      if (data?.id) {
        this._applyUser(data);
      }
    } catch (error) {
      console.error('get user request failed', error);
    }
  }
}
