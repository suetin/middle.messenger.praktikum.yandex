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
import { getUser, updateProfile } from '../api/user';
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
  login: string;
  email: string;
  phone: string;
  avatar: string | null;
};

type ProfileEditProps = {
  user?: UserProfile | null;
};

const DEFAULT_AVATAR = '/avatar.png';

const PROFILE_FIELDS = [
  { label: 'Почта', name: 'email', type: 'text' },
  { label: 'Логин', name: 'login', type: 'text' },
  { label: 'Имя', name: 'first_name', type: 'text' },
  { label: 'Фамилия', name: 'second_name', type: 'text' },
  { label: 'Отображаемое имя', name: 'display_name', type: 'text' },
  { label: 'Телефон', name: 'phone', type: 'text' },
];

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

export default class ProfileEditPage extends Block<ProfileEditProps> {
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

    const user = this.props.user;
    const inputComponents = PROFILE_FIELDS.reduce<Record<string, Input>>((acc, field) => {
      const value = user ? user[field.name as keyof UserProfile] : '';
      const input = new Input({
        label: field.label,
        name: field.name,
        type: field.type,
        value: typeof value === 'string' ? value : '',
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
        click: async (event: Event) => {
          event.preventDefault();
          const form = document.getElementById('profile-form') as HTMLFormElement | null;
          if (!form) return;
          if (!validateAndDisplayErrors(form, inputsByName)) return;
          const formData = new FormData(form);
          const payload: Record<string, string> = {};
          formData.forEach((value, key) => {
            if (typeof value === 'string') {
              payload[key] = value;
            }
          });
          try {
            const response = await updateProfile(payload);
            if (handleAuthResponse(response)) {
              return;
            }
            if (response.status < 200 || response.status >= 300) {
              console.error('update profile error', response.status, response.responseText);
              return;
            }
            const router = new Router('#app');
            router.go('/settings');
          } catch (error) {
            console.error('update profile request failed', error);
          }
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
    const user = this.props.user;
    const viewModel = {
      avatar: user ? getAvatarUrl(user.avatar) : DEFAULT_AVATAR,
      name: user ? getUserName(user) : 'Пользователь',
      fields: PROFILE_FIELDS.map((field) => {
        const value = user ? user[field.name as keyof UserProfile] : '';
        return {
          ...field,
          value: typeof value === 'string' ? value : '',
        };
      }),
    };
    renderWithComponents(profileLayoutTemplate, viewModel, this._components, root);
    const firstChild = root.firstElementChild;
    return firstChild instanceof HTMLElement ? firstChild : root;
  }

  componentDidUpdate(oldProps: ProfileEditProps, newProps: ProfileEditProps) {
    if (oldProps.user !== newProps.user) {
      this._syncInputs(newProps.user);
    }
    return true;
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

  private _syncInputs(user?: UserProfile | null) {
    Object.entries(this._inputsByName).forEach(([nameKey, input]) => {
      const value = user ? user[nameKey as keyof UserProfile] : '';
      input.setProps({
        value: typeof value === 'string' ? value : '',
        error: undefined,
      });
    });
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
        this.setProps({ user: data });
      }
    } catch (error) {
      console.error('get user request failed', error);
    }
  }
}
