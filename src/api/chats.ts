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

export function deleteChat(chatId: number) {
  return chatApi.delete(`${BASE_URL}/chats`, {
    headers: { 'Content-Type': 'application/json' },
    data: JSON.stringify({ chatId }),
  });
}

export function addUsersToChat(chatId: number, users: number[]) {
  return chatApi.put(`${BASE_URL}/chats/users`, {
    headers: { 'Content-Type': 'application/json' },
    data: JSON.stringify({ users, chatId }),
  });
}

export function removeUsersFromChat(chatId: number, users: number[]) {
  return chatApi.delete(`${BASE_URL}/chats/users`, {
    headers: { 'Content-Type': 'application/json' },
    data: JSON.stringify({ users, chatId }),
  });
}

export function getChatToken(chatId: number) {
  return chatApi.post(`${BASE_URL}/chats/token/${chatId}`, {
    headers: { 'Content-Type': 'application/json' },
  });
}

export function getChatUsers(chatId: number) {
  return chatApi.get(`${BASE_URL}/chats/${chatId}/users`, {
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
