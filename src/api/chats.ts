import HTTPTransport from '../lib/HTTPTransport';
import { BASE_URL } from './base';

const chatApi = new HTTPTransport();

export function getChats() {
  return chatApi.get(`${BASE_URL}/chats`, {
    headers: { 'Content-Type': 'application/json' },
  });
}

export function createChat(title: string) {
  return chatApi.post(`${BASE_URL}/chats`, {
    headers: { 'Content-Type': 'application/json' },
    data: JSON.stringify({ title }),
  });
}

export function getChatToken(chatId: number) {
  return chatApi.post(`${BASE_URL}/chats/token/${chatId}`, {
    headers: { 'Content-Type': 'application/json' },
  });
}

export function getChatFiles(chatId: number) {
  return chatApi.get(`${BASE_URL}/chats/${chatId}/files`, {
    headers: { 'Content-Type': 'application/json' },
  });
}

export function uploadResource(file: File) {
  const formData = new FormData();
  formData.append('resource', file);
  return chatApi.post(`${BASE_URL}/resources`, {
    data: formData,
  });
}

export function getUser() {
  return chatApi.get(`${BASE_URL}/auth/user`, {
    headers: { 'Content-Type': 'application/json' },
  });
}
