import { isSuccessful, safeRequest } from './http';

type AvatarUploadOptions<T> = {
  form: HTMLFormElement;
  label: string;
  upload: (file: File) => Promise<XMLHttpRequest>;
  onSuccess: (data: T) => void;
  onAuth?: (response: XMLHttpRequest) => boolean;
  name?: string;
  invalidFileMessage?: string;
};

const isImageFile = (file: File) => {
  if (file.type) {
    return file.type.startsWith('image/');
  }
  return /\.(png|jpe?g|gif|webp|svg)$/i.test(file.name);
};

export async function submitAvatarForm<T>(options: AvatarUploadOptions<T>) {
  const {
    form,
    label,
    upload,
    onSuccess,
    onAuth,
    name = 'avatar',
    invalidFileMessage = 'avatar file must be an image',
  } = options;
  const input = form.querySelector(
    `input[type="file"][name="${name}"]`,
  ) as HTMLInputElement | null;
  const file = input?.files?.[0];
  if (!file) {
    return false;
  }
  if (!isImageFile(file)) {
    console.error(invalidFileMessage);
    form.reset();
    return false;
  }

  const response = await safeRequest(() => upload(file), label);
  if (!response || (onAuth && onAuth(response))) return false;
  if (!isSuccessful(response, label)) return false;

  const data = JSON.parse(response.responseText) as T;
  onSuccess(data);
  form.reset();
  return true;
}
