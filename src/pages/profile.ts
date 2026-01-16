import Handlebars from 'handlebars';
import profileLayoutTemplate from '../layout/profile.hbs?raw';
import backToTemplate from '../partials/backTo.hbs?raw';
import avatarFormTemplate from '../partials/avatarForm.hbs?raw';
import Block from '../lib/Block';
import HTTPTransport from '../lib/HTTPTransport';
import Router from '../lib/router/Router';
import { BASE_URL } from '../api/base';
import { getUser } from '../api/user';
import { handleAuthResponse } from '../lib/apiGuard';
import { bindAvatarModal } from '../lib/avatarModal';
import { getResourceUrl } from '../lib/resourceUrl';

Handlebars.registerPartial('back-to', backToTemplate);
Handlebars.registerPartial('avatar-form', avatarFormTemplate);
const template = Handlebars.compile(profileLayoutTemplate);

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

const DEFAULT_AVATAR = '/avatar.png';
const PROFILE_FIELDS = [
  { label: 'Почта', name: 'email' },
  { label: 'Логин', name: 'login' },
  { label: 'Имя', name: 'first_name' },
  { label: 'Фамилия', name: 'second_name' },
  { label: 'Отображаемое имя', name: 'display_name' },
  { label: 'Телефон', name: 'phone' },
];

const data = {
  avatar: DEFAULT_AVATAR,
  name: 'Пользователь',
  fields: PROFILE_FIELDS.map((field) => ({ ...field, value: '' })),
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

export default class ProfilePage extends Block {
  render() {
    const html = template(data).trim();
    const tpl = document.createElement('template');
    tpl.innerHTML = html;
    const firstChild = tpl.content.firstElementChild;
    return firstChild instanceof HTMLElement ? firstChild : '';
  }

  componentDidMount() {
    const root = this.getContent();
    const logoutLink = root.querySelector('[data-logout]');

    bindAvatarModal(root, (avatarUrl) => this._updateAvatar(avatarUrl));
    this._loadUser();

    if (logoutLink) {
      logoutLink.addEventListener('click', async (event) => {
        event.preventDefault();
        const authApi = new HTTPTransport();
        try {
          const response = await authApi.post(`${BASE_URL}/auth/logout`);
          if (response.status >= 200 && response.status < 300) {
            const router = new Router('#app');
            router.setAuth(false);
            router.go('/');
            return;
          }
          console.error('logout error', response.status, response.responseText);
        } catch (error) {
          console.error('logout request failed', error);
        }
      });
    }
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
    PROFILE_FIELDS.forEach((field) => {
      const value = user[field.name as keyof UserProfile];
      const valueEl = root.querySelector(`[data-field="${field.name}"]`);
      if (valueEl) {
        valueEl.textContent = typeof value === 'string' ? value : '';
      }
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
        this._applyUser(data);
      }
    } catch (error) {
      console.error('get user request failed', error);
    }
  }
}
