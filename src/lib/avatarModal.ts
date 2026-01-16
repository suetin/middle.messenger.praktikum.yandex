import { updateAvatar } from '../api/user';
import { BASE_URL } from '../api/base';
import { handleAuthResponse } from './apiGuard';
import { getResourceUrl } from './resourceUrl';

type AvatarUpdateHandler = (avatarUrl: string) => void;

export function bindAvatarModal(root: HTMLElement, onAvatarUpdated: AvatarUpdateHandler) {
  const modal = root.querySelector('.js-avatar-modal');
  const openButton = root.querySelector('.js-avatar-open-form');

  if (!(modal instanceof HTMLElement)) {
    return;
  }

  const closeModal = () => {
    modal.classList.remove('avatar-modal--open');
  };

  if (openButton) {
    openButton.addEventListener('click', () => {
      modal.classList.toggle('avatar-modal--open');
    });
  }

  modal.addEventListener('click', (event) => {
    if (event.target === modal) {
      closeModal();
    }
  });

  const form = modal.querySelector('form.avatar-form');
  if (form instanceof HTMLFormElement) {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const input = form.querySelector('input[type="file"][name="avatar"]') as HTMLInputElement | null;
      const file = input?.files?.[0];
      if (!file) {
        return;
      }

      try {
        const response = await updateAvatar(file);
        if (handleAuthResponse(response)) {
          return;
        }
        if (response.status < 200 || response.status >= 300) {
          console.error('update avatar error', response.status, response.responseText);
          return;
        }
        const data = JSON.parse(response.responseText || '{}') as { avatar?: string | null };
        if (data.avatar) {
          onAvatarUpdated(getResourceUrl(BASE_URL, data.avatar));
        }
        form.reset();
        closeModal();
      } catch (error) {
        console.error('update avatar request failed', error);
      }
    });
  }
}
