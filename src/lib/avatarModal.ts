import { updateAvatar } from '../api/user';
import { BASE_URL } from '../api/base';
import { handleAuthResponse } from './apiGuard';
import { isSuccessful, safeRequest } from './http';
import { getResourceUrl } from './resourceUrl';

type AvatarUpdateHandler = (avatarUrl: string) => void;

const isImageFile = (file: File) => {
  if (file.type) {
    return file.type.startsWith('image/');
  }
  return /\.(png|jpe?g|gif|webp|svg)$/i.test(file.name);
};

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
      if (!isImageFile(file)) {
        console.error('avatar file must be an image');
        form.reset();
        return;
      }

      const response = await safeRequest(() => updateAvatar(file), 'update avatar');
      if (!response || handleAuthResponse(response)) {
        return;
      }
      if (!isSuccessful(response, 'update avatar')) {
        return;
      }
      const data = JSON.parse(response.responseText) as { avatar?: string | null };
      if (data.avatar) {
        onAvatarUpdated(getResourceUrl(BASE_URL, data.avatar));
      }
      form.reset();
      closeModal();
    });
  }
}
