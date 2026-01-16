import HTTPTransport from '../lib/HTTPTransport';
import { BASE_URL } from './base';

const userApi = new HTTPTransport();

export function getUser() {
  return userApi.get(`${BASE_URL}/auth/user`, {
    headers: { 'Content-Type': 'application/json' },
  });
}

export function updateProfile(data: Record<string, string>) {
  return userApi.put(`${BASE_URL}/user/profile`, {
    headers: { 'Content-Type': 'application/json' },
    data: JSON.stringify(data),
  });
}

export function updatePassword(data: { oldPassword: string; newPassword: string }) {
  return userApi.put(`${BASE_URL}/user/password`, {
    headers: { 'Content-Type': 'application/json' },
    data: JSON.stringify(data),
  });
}

export function updateAvatar(file: File) {
  const formData = new FormData();
  formData.append('avatar', file);
  return userApi.put(`${BASE_URL}/user/profile/avatar`, {
    data: formData,
  });
}
