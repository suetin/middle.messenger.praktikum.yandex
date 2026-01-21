import Handlebars from 'handlebars';
import chatLayoutTemplate from '../layout/chat.hbs?raw';
import chatSidebarPartial from '../partials/chatSidebar.hbs?raw';
import chatSidebarItem from '../partials/chatSidebarItem.hbs?raw';
import chatContentPartial from '../partials/chatContent.hbs?raw';
import chatMessagePartial from '../partials/chatMessage.hbs?raw';
import chatUsersModalPartial from '../partials/chatUsersModal.hbs?raw';
import avatarFormPartial from '../partials/avatarForm.hbs?raw';
import Block from '../lib/Block';
import type { BlockProps } from '../lib/Block';
import { handleAuthResponse } from '../lib/apiGuard';
import ChatSocket from '../lib/ChatSocket';
import { renderWithComponents } from '../lib/render';
import Input from '../components/Input';
import Button from '../components/Button';
import { getResourceUrl } from '../lib/resourceUrl';
import { formatTime } from '../lib/formatters';
import { isSuccessful, safeRequest } from '../lib/http';
import { BASE_URL } from '../api/base';
import { bindAvatarUploadModal } from '../lib/avatarModal';
import {
  createChat,
  getChatFiles,
  getChatToken,
  getChatUsers,
  getChats,
  getUser,
  uploadResource,
  updateChatAvatar,
  addUsersToChat,
  removeUsersFromChat,
  deleteChat,
} from '../api/chats';
import { searchUser } from '../api/user';

let currentUserId: number | null = null;

type ChatItem = {
  id: number;
  title: string;
  avatar: string | null;
  unread_count: number;
  last_message: { content: string; time: string };
};

type ActiveChat = ChatItem;

type RawChatMessage = {
  id?: number;
  type?: string;
  content?: unknown;
  time?: unknown;
  user_id?: number;
  file?: { path?: string };
};

type UserSearchResult = {
  id: number;
  login: string;
  display_name: string;
  first_name: string;
  second_name: string;
  phone: string;
  avatar: string;
  email: string;
};

type UserSearchViewItem = UserSearchResult & {
  inChat: boolean;
  added: boolean;
};

type ChatMessage = {
  id: string;
  text: string;
  image: string;
  time: string;
  isOwn: boolean;
};

type ChatUser = {
  id: number;
  login: string;
  display_name: string | null;
  first_name: string;
  second_name: string;
  avatar: string | null;
  role: string;
};

type ChatPageProps = BlockProps & {
  chats: ChatItem[];
  activeChat: ActiveChat | null;
  activeChatId: number | null;
  messages: ChatMessage[];
  chatUsers: ChatUser[];
  activeChatUser: ChatUser | null;
  isUserModalOpen: boolean;
  userSearchQuery: string;
  userSearchResults: UserSearchViewItem[];
  userSearchAddedIds: number[];
  params?: Record<string, string>;
  pathname?: string;
  events?: Record<string, EventListener>;
};

const DEFAULT_AVATAR = '/avatar.png';

const getChatAvatarUrl = (value?: string | null) =>
  value ? getResourceUrl(BASE_URL, value) : DEFAULT_AVATAR;

const getChatUserName = (user?: ChatUser | null) => {
  if (!user) {
    return '';
  }
  const firstName = user.first_name.trim();
  const lastName = user.second_name.trim();
  if (firstName && lastName) {
    return `${firstName} ${lastName}`;
  }
  if (firstName) {
    return firstName;
  }
  return user.display_name ?? user.login;
};

const getChatUserAvatarUrl = (user?: ChatUser | null) => {
  if (!user || !user.avatar) {
    return DEFAULT_AVATAR;
  }
  return getResourceUrl(BASE_URL, user.avatar);
};

Handlebars.registerPartial('chat-sidebar', chatSidebarPartial);
Handlebars.registerPartial('chat-content', chatContentPartial);
Handlebars.registerPartial('chat-message', chatMessagePartial);
Handlebars.registerPartial('chat-sidebar-item', chatSidebarItem);
Handlebars.registerPartial('chat-users-modal', chatUsersModalPartial);
Handlebars.registerPartial('avatar-form', avatarFormPartial);
Handlebars.registerHelper('eq', (left: unknown, right: unknown) => left === right);
Handlebars.registerHelper('formatTime', (value?: string) => formatTime(String(value)));
Handlebars.registerHelper('chatAvatar', (value?: string | null) => getChatAvatarUrl(value));
Handlebars.registerHelper('chatUserName', (user?: ChatUser | null) => getChatUserName(user));
Handlebars.registerHelper('chatUserAvatar', (user?: ChatUser | null) => getChatUserAvatarUrl(user));

export default class ChatPage extends Block<ChatPageProps> {
  private _components: Record<string, Input | Button> = {};
  private _componentsInitialized = false;
  private _userId: number | null = null;
  private _socket: ChatSocket | null = null;
  private _resourcePaths: Map<number, string> = new Map();
  private _authChecked = false;

  constructor(tagName: string = 'div', props: BlockProps = {}) {
    const typedProps = props as ChatPageProps;
    const baseProps = {
      ...typedProps,
      chats: typedProps.chats ?? [],
      activeChat: typedProps.activeChat ?? null,
      activeChatId: typedProps.activeChatId ?? null,
      messages: typedProps.messages ?? [],
      chatUsers: typedProps.chatUsers ?? [],
      activeChatUser: typedProps.activeChatUser ?? null,
      isUserModalOpen: typedProps.isUserModalOpen ?? false,
      userSearchQuery: typedProps.userSearchQuery ?? '',
      userSearchResults: typedProps.userSearchResults ?? [],
      userSearchAddedIds: typedProps.userSearchAddedIds ?? [],
    };
    super(tagName, baseProps);
    const mergedEvents = {
      ...(typedProps.events ?? {}),
      click: (event: Event) => {
        this._handleChatClick(event as MouseEvent);
      },
      change: (event: Event) => {
        this._handleFileChange(event);
      },
      submit: (event: Event) => {
        this._handleFormSubmit(event);
      },
    };
    this.setProps({ events: mergedEvents });
  }

  private _initComponents() {
    if (this._componentsInitialized) {
      return;
    }

    const messageInput = new Input({
      name: 'message',
      placeholder: 'Сообщение',
      variant: 'filled',
      className: 'chat-content__input',
    });

    const searchIcon = '<img src="/search.svg" alt="" />';
    const chatSearch = new Input({
      name: 'search',
      placeholder: 'Поиск',
      variant: 'filled',
      icon: searchIcon,
    });

    const sendButton = new Button({
      icon: '/send.svg',
      ariaLabel: 'Отправить сообщение',
      variant: 'icon',
      className: 'chat-content__send',
      events: {
        click: (event: Event) => {
          event.preventDefault();
          const root = this.getContent();
          const form = root.querySelector('.chat-content__form') as HTMLFormElement | null;
          if (!form) return;
          this._sendMessage(messageInput.value);
          messageInput.setValue('');
        },
      },
    });

    this._components = {
      'chat-search': chatSearch,
      'message-input': messageInput,
      'send-button': sendButton,
    };
    this._componentsInitialized = true;
  }

  componentDidMount() {
    this._loadChats();
    this._applyActiveFromParams();
  }

  componentDidUpdate(oldProps: ChatPageProps, newProps: ChatPageProps) {
    if (oldProps.params?.chatId !== newProps.params?.chatId) {
      this._applyActiveFromParams();
    }
    return true;
  }

  private _applyActiveFromParams() {
    const rawId = this.props.params?.chatId;
    if (!rawId) {
      if (this.props.activeChatId !== null) {
        this.setProps({
          activeChatId: null,
          activeChat: null,
          messages: [],
          chatUsers: [],
          activeChatUser: null,
          isUserModalOpen: false,
          userSearchQuery: '',
          userSearchResults: [],
          userSearchAddedIds: [],
        });
      }
      this._closeSocket();
      return;
    }
    const chatId = Number(rawId);
    if (!Number.isFinite(chatId)) {
      return;
    }
    this._setActiveChat(chatId, { syncUrl: false });
  }

  private _handleChatClick = (event: MouseEvent) => {
    const target = event.target as HTMLElement | null;
    const createButton = target?.closest('[data-create-chat]');
    if (createButton) {
      event.preventDefault();
      void this._createChat();
      return;
    }
    const attachButton = target?.closest('[data-attach-button]');
    if (attachButton) {
      event.preventDefault();
      const root = this.getContent();
      const input = root.querySelector('[data-attach-input]') as HTMLInputElement | null;
      input?.click();
      return;
    }
    const addUserButton = target?.closest('[data-add-user]');
    if (addUserButton) {
      event.preventDefault();
      this._openUserModal();
      return;
    }
    const removeUserButton = target?.closest('[data-remove-user-id]');
    if (removeUserButton) {
      event.preventDefault();
      const id = (removeUserButton as HTMLElement).dataset.removeUserId;
      const userId = id ? Number(id) : null;
      if (userId && Number.isFinite(userId)) {
        void this._removeUserFromChat(userId);
      }
      this._closeChatMenu();
      return;
    }
    const modalCloseButton = target?.closest('[data-user-modal-close]');
    if (modalCloseButton) {
      event.preventDefault();
      this._closeUserModal();
      return;
    }
    const modalAddButton = target?.closest('[data-add-user-id]');
    if (modalAddButton) {
      event.preventDefault();
      const id = (modalAddButton as HTMLElement).dataset.addUserId;
      const userId = id ? Number(id) : null;
      if (userId && Number.isFinite(userId)) {
        void this._addUserIdToChat(userId);
      }
      return;
    }
    const deleteChatButton = target?.closest('[data-delete-chat]');
    if (deleteChatButton) {
      event.preventDefault();
      void this._deleteActiveChat();
      this._closeChatMenu();
      return;
    }
    if (target?.matches('[data-user-modal]') && this.props.isUserModalOpen) {
      this._closeUserModal();
      return;
    }
    const menuToggle = target?.closest('[data-chat-menu-toggle]');
    if (menuToggle) {
      event.preventDefault();
      this._toggleChatMenu();
      return;
    }
    if (this._isChatMenuOpen() && !target?.closest('[data-chat-menu-wrapper]')) {
      this._closeChatMenu();
    }
    const item = target?.closest('[data-chat-id]') as HTMLElement | null;
    if (!item) return;
    const id = item.dataset.chatId;
    if (!id) return;
    const chatId = Number(id);
    if (!Number.isFinite(chatId)) return;
    this._clearUnreadCount(chatId);
    this._setActiveChat(chatId, { syncUrl: true });
  };

  private _handleFileChange(event: Event) {
    const target = event.target as HTMLInputElement | null;
    if (!target || !target.matches('[data-attach-input]')) {
      return;
    }
    const file = target.files?.[0];
    if (!file) {
      return;
    }
    void this._uploadFile(file);
    target.value = '';
  }

  private async _createChat() {
    const title = window.prompt('Название чата');
    if (!title) {
      return;
    }
    const response = await safeRequest(() => createChat(title), 'create chat');
    if (!response || this._handleAuth(response)) return;
    if (!isSuccessful(response, 'create chat')) return;
    await this._loadChats();
  }

  private _openUserModal() {
    this.setProps({
      isUserModalOpen: true,
      userSearchQuery: '',
      userSearchResults: [],
      userSearchAddedIds: [],
    });
  }

  private _closeUserModal() {
    this.setProps({ isUserModalOpen: false });
  }

  private _handleFormSubmit(event: Event) {
    const target = event.target as HTMLElement | null;
    if (!target || !target.matches('[data-user-search-form]')) {
      return;
    }
    event.preventDefault();
    const form = target as HTMLFormElement;
    const input = form.querySelector('[name="user-search"]') as HTMLInputElement | null;
    const query = input?.value.trim() ?? '';
    if (!query) {
      this.setProps({ userSearchResults: [], userSearchQuery: '' });
      return;
    }
    void this._searchUsers(query);
  }

  private async _searchUsers(query: string) {
    const response = await safeRequest(() => searchUser(query), 'search user');
    if (!response || this._handleAuth(response)) return;
    if (!isSuccessful(response, 'search user')) return;
    const users = JSON.parse(response.responseText) as UserSearchResult[];
    const chatUserIds = new Set(this.props.chatUsers.map((user) => user.id));
    const addedIds = new Set(this.props.userSearchAddedIds);
    const results: UserSearchViewItem[] = users.map((user) => ({
      ...user,
      inChat: chatUserIds.has(user.id),
      added: addedIds.has(user.id),
    }));
    this.setProps({
      userSearchResults: results,
      userSearchQuery: query,
    });
  }

  private async _addUserIdToChat(userId: number) {
    const chatId = this.props.activeChatId;
    if (!chatId) {
      return;
    }
    const addResponse = await safeRequest(
      () => addUsersToChat(chatId, [userId]),
      'add users to chat',
    );
    if (!addResponse || this._handleAuth(addResponse)) return;
    if (!isSuccessful(addResponse, 'add users')) return;
    const addedIds = new Set(this.props.userSearchAddedIds);
    addedIds.add(userId);
    await this._loadChatUsers(chatId);
    this._refreshSearchResults(Array.from(addedIds));
  }

  private _refreshSearchResults(addedIds: number[]) {
    const chatUserIds = new Set(this.props.chatUsers.map((user) => user.id));
    const added = new Set(addedIds);
    const results = this.props.userSearchResults.map((user) => ({
      ...user,
      inChat: chatUserIds.has(user.id),
      added: added.has(user.id),
    }));
    this.setProps({
      userSearchResults: results,
      userSearchAddedIds: addedIds,
    });
  }

  private async _removeUserFromChat(userId: number) {
    const chatId = this.props.activeChatId;
    if (!chatId) {
      return;
    }
    const shouldRemove = window.confirm('Удалить пользователя из чата?');
    if (!shouldRemove) {
      return;
    }
    const removeResponse = await safeRequest(
      () => removeUsersFromChat(chatId, [userId]),
      'remove users from chat',
    );
    if (!removeResponse || this._handleAuth(removeResponse)) return;
    if (!isSuccessful(removeResponse, 'remove users')) return;
    await this._loadChatUsers(chatId);
  }

  private async _deleteActiveChat() {
    const chatId = this.props.activeChatId;
    if (!chatId) {
      return;
    }
    const shouldDelete = window.confirm('Удалить чат?');
    if (!shouldDelete) {
      return;
    }
    const response = await safeRequest(() => deleteChat(chatId), 'delete chat');
    if (!response || this._handleAuth(response)) return;
    if (!isSuccessful(response, 'delete chat')) return;
    await this._loadChats();
    this.setProps({
      activeChatId: null,
      activeChat: null,
      messages: [],
      chatUsers: [],
      activeChatUser: null,
      isUserModalOpen: false,
      userSearchQuery: '',
      userSearchResults: [],
      userSearchAddedIds: [],
    });
    this._closeSocket();
    window.history.pushState({}, '', '/messenger');
  }

  private _setActiveChat(chatId: number, options: { syncUrl: boolean }) {
    if (this.props.activeChatId === chatId && this.props.activeChat) {
      return;
    }
    const chats = this.props.chats;
    const activeChat = chats.find((chat) => chat.id === chatId) ?? null;
    if (options.syncUrl) {
      window.history.pushState({}, '', `/messenger/${chatId}`);
    }
    this._resourcePaths.clear();
    this.setProps({
      activeChatId: chatId,
      activeChat,
      messages: [],
      chatUsers: [],
      activeChatUser: null,
      isUserModalOpen: false,
      userSearchQuery: '',
      userSearchResults: [],
      userSearchAddedIds: [],
    });
    if (activeChat) {
      void this._connectToChat(chatId);
    }
  }

  private _clearUnreadCount(chatId: number) {
    const chats = this.props.chats;
    const nextChats = chats.map((chat) =>
      chat.id === chatId ? { ...chat, unread_count: 0 } : chat,
    );
    this.setProps({ chats: nextChats });
  }

  private async _loadChats() {
    const response = await safeRequest(() => getChats(), 'get chats');
    if (!response || this._handleAuth(response)) return;
    if (!isSuccessful(response, 'get chats')) return;

    const chats = JSON.parse(response.responseText) as ChatItem[];
    this.setProps({ chats });
    this._applyActiveFromParams();
  }

  private _sendMessage(content: string) {
    const message = content.trim();
    if (!message) {
      return;
    }
    this._socket?.sendMessage(message);
  }

  private _sendFile(fileId: number) {
    this._socket?.sendFile(fileId);
  }

  private async _uploadFile(file: File) {
    const response = await safeRequest(() => uploadResource(file), 'upload file');
    if (!response || this._handleAuth(response)) return;
    if (!isSuccessful(response, 'upload file')) return;

    const data = JSON.parse(response.responseText) as { id?: number; path?: string };
    if (typeof data.id === 'number') {
      if (data.path) {
        this._resourcePaths.set(data.id, data.path);
      }
      this._sendFile(data.id);
    }
  }

  private async _connectToChat(chatId: number) {
    this._closeSocket();

    const userId = await this._ensureUserId();
    if (!userId) {
      return;
    }

    await this._loadChatUsers(chatId);
    await this._loadChatFiles(chatId);
    const response = await safeRequest(() => getChatToken(chatId), 'get token');
    if (!response || this._handleAuth(response)) return;
    if (!isSuccessful(response, 'get token')) return;

    const data = JSON.parse(response.responseText) as { token: string };
    this._socket = new ChatSocket({
      onMessage: (payload) => this._handleSocketMessage(payload),
      onError: (event) => console.error('socket error', event),
    });
    this._socket.connect({ userId, chatId, token: data.token });
  }

  private _handleSocketMessage(data: string) {
    let payload: unknown;
    try {
      payload = JSON.parse(data);
    } catch {
      return;
    }

    if (Array.isArray(payload)) {
      const messages = payload
        .filter((item) => this._isChatMessage(item))
        .map((item) => this._normalizeMessage(item))
        .reverse();
      this.setProps({ messages });
      return;
    }

    if (!this._isChatMessage(payload)) {
      return;
    }

    const current = this.props.messages;
    this.setProps({
      messages: [...current, this._normalizeMessage(payload)],
    });
  }

  private _isChatMessage(value: unknown): value is RawChatMessage {
    if (typeof value !== 'object' || value === null) {
      return false;
    }
    const type = (value as { type?: unknown }).type;
    return type === 'message' || type === 'file';
  }

  private _normalizeMessage(message: RawChatMessage): ChatMessage {
    const resolvedId = String(message.id ?? '');
    const type = String(message.type ?? '');
    if (type === 'file') {
      const file = message.file;
      const content = String(message.content ?? '');
      const image = file?.path
        ? getResourceUrl(BASE_URL, file.path)
        : getResourceUrl(BASE_URL, content, this._resourcePaths);
      return {
        id: resolvedId,
        image,
        text: '',
        isOwn: message.user_id === currentUserId,
        time: formatTime(String(message.time ?? '')),
      };
    }
    return {
      id: resolvedId,
      text: String(message.content ?? ''),
      image: '',
      isOwn: message.user_id === currentUserId,
      time: formatTime(String(message.time ?? '')),
    };
  }

  private _selectActiveChatUser(users: ChatUser[]) {
    const currentId = this._userId ?? currentUserId;
    if (!users.length) {
      return null;
    }
    if (currentId) {
      const others = users.filter((user) => user.id !== currentId);
      if (others.length > 0) {
        return others[0] ?? null;
      }
      return users[0] ?? null;
    }
    return users[0] ?? null;
  }

  private async _loadChatUsers(chatId: number) {
    const response = await safeRequest(() => getChatUsers(chatId), 'get chat users');
    if (!response || this._handleAuth(response)) return;
    if (!isSuccessful(response, 'get chat users')) return;

    const users = JSON.parse(response.responseText) as ChatUser[];
    this.setProps({
      chatUsers: users,
      activeChatUser: this._selectActiveChatUser(users),
    });
    if (this.props.userSearchResults.length) {
      this._refreshSearchResults(this.props.userSearchAddedIds);
    }
  }

  private async _loadChatFiles(chatId: number) {
    const response = await safeRequest(() => getChatFiles(chatId), 'get chat files');
    if (!response || this._handleAuth(response)) return;
    if (!isSuccessful(response, 'get chat files')) return;

    const files = JSON.parse(response.responseText) as Array<{ id?: number; path?: string }>;
    files.forEach((file) => {
      if (typeof file.id === 'number' && file.path) {
        this._resourcePaths.set(file.id, file.path);
      }
    });
  }

  private async _ensureUserId() {
    if (this._userId) {
      return this._userId;
    }
    const response = await safeRequest(() => getUser(), 'get user');
    if (!response || this._handleAuth(response)) return null;
    if (!isSuccessful(response, 'get user')) return null;
    const data = JSON.parse(response.responseText) as { id?: number };
    if (typeof data.id === 'number') {
      this._userId = data.id;
      currentUserId = data.id;
      return data.id;
    }
    return null;
  }


  private _handleAuth(response: XMLHttpRequest) {
    if (!this._authChecked) {
      this._authChecked = true;
    }
    return handleAuthResponse(response);
  }


  private _isChatMenuOpen() {
    const root = this.getContent();
    const menu = root.querySelector('[data-chat-menu-wrapper]');
    return menu?.classList.contains('chat-content__menu--open') ?? false;
  }

  private _toggleChatMenu() {
    const root = this.getContent();
    const menu = root.querySelector('[data-chat-menu-wrapper]');
    if (menu instanceof HTMLElement) {
      menu.classList.toggle('chat-content__menu--open');
    }
  }

  private _closeChatMenu() {
    const root = this.getContent();
    const menu = root.querySelector('[data-chat-menu-wrapper]');
    if (menu instanceof HTMLElement) {
      menu.classList.remove('chat-content__menu--open');
    }
  }

  private _closeSocket() {
    if (this._socket) {
      this._socket.close();
      this._socket = null;
    }
  }

  destroy() {
    this._closeSocket();
    super.destroy();
  }

  render() {
    this._initComponents();
    const root = document.createElement('div');
    renderWithComponents(chatLayoutTemplate, this.props, this._components, root);
    const content = root.firstElementChild instanceof HTMLElement ? root.firstElementChild : root;
    bindAvatarUploadModal<{ id?: number; avatar?: string | null }>({
      root: content,
      label: 'update chat avatar',
      upload: (file) => {
        const chatId = this.props.activeChatId;
        if (!chatId) {
          return Promise.reject(new Error('chatId is missing'));
        }
        return updateChatAvatar(chatId, file);
      },
      onAuth: (response) => this._handleAuth(response),
      invalidFileMessage: 'chat avatar file must be an image',
      onSuccess: (data) => {
        const chatId = this.props.activeChatId;
        if (!chatId) {
          return;
        }
        const updatedId = data.id ?? chatId;
        const updatedAvatar =
          typeof data.avatar === 'undefined' ? this.props.activeChat?.avatar ?? null : data.avatar;
        const chats = this.props.chats.map((chat) =>
          chat.id === updatedId ? { ...chat, avatar: updatedAvatar } : chat,
        );
        const activeChat =
          this.props.activeChat && this.props.activeChat.id === updatedId
            ? { ...this.props.activeChat, avatar: updatedAvatar }
            : this.props.activeChat;
        this.setProps({ chats, activeChat });
      },
    });
    return content;
  }
}
