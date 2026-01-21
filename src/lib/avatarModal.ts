import { updateAvatar } from '../api/user';
import { BASE_URL } from '../api/base';
import { handleAuthResponse } from './apiGuard';
import { getResourceUrl } from './resourceUrl';
import { submitAvatarForm } from './avatarUpload';

type AvatarUpdateHandler = (avatarUrl: string) => void;

type AvatarUploadModalOptions<T> = {
  root: HTMLElement;
  label: string;
  upload: (file: File) => Promise<XMLHttpRequest>;
  onSuccess: (data: T) => void;
  onAuth?: (response: XMLHttpRequest) => boolean;
  openSelector?: string;
  modalSelector?: string;
  formSelector?: string;
  invalidFileMessage?: string;
};

export function bindAvatarUploadModal<T>(options: AvatarUploadModalOptions<T>) {
  const {
    root,
    label,
    upload,
    onSuccess,
    onAuth,
    openSelector = '.js-avatar-open-form',
    modalSelector = '.js-avatar-modal',
    formSelector = 'form.avatar-form',
    invalidFileMessage,
  } = options;
  const modal = root.querySelector(modalSelector);
  const openButton = root.querySelector(openSelector);

  if (!(modal instanceof HTMLElement)) {
    return;
  }

  const closeModal = () => {
    modal.classList.remove('avatar-modal--open');
  };

  if (openButton instanceof HTMLElement) {
    openButton.addEventListener('click', () => {
      modal.classList.toggle('avatar-modal--open');
    });
  }

  modal.addEventListener('click', (event) => {
    if (event.target === modal) {
      closeModal();
    }
  });

  const form = modal.querySelector(formSelector);
  if (form instanceof HTMLFormElement) {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const updated = await submitAvatarForm<T>({
        form,
        label,
        upload,
        onAuth,
        onSuccess,
        invalidFileMessage,
      });
      if (updated) {
        closeModal();
      }
    });
  }
}

export function bindAvatarModal(root: HTMLElement, onAvatarUpdated: AvatarUpdateHandler) {
  bindAvatarUploadModal<{ avatar?: string | null }>({
    root,
    label: 'update avatar',
    upload: (file) => updateAvatar(file),
    onAuth: (response) => handleAuthResponse(response),
    onSuccess: (data) => {
      if (data.avatar) {
        onAvatarUpdated(getResourceUrl(BASE_URL, data.avatar));
      }
    },
  });
}
