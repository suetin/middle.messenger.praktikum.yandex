import Handlebars from 'handlebars';
import chatLayoutTemplate from '../layout/chat.hbs?raw';
import chatSidebarPartial from '../partials/chatSidebar.hbs?raw';
import chatSidebarItem from '../partials/chatSidebarItem.hbs?raw';
import chatContentPartial from '../partials/chatContent.hbs?raw';
import chatMessagePartial from '../partials/chatMessage.hbs?raw';
import Block from '../lib/Block';
import type { BlockProps } from '../lib/Block';
import { handleAuthResponse } from '../lib/apiGuard';
import ChatSocket from '../lib/ChatSocket';
import { renderWithComponents } from '../lib/render';
import Input from '../components/Input';
import Button from '../components/Button';
import { getResourceUrl } from '../lib/resourceUrl';
import { formatTime } from '../lib/formatters';
import { BASE_URL } from '../api/base';
import {
  createChat,
  getChatFiles,
  getChatToken,
  getChats,
  getUser,
  uploadResource,
} from '../api/chats';

Handlebars.registerPartial('chat-sidebar', chatSidebarPartial);
Handlebars.registerPartial('chat-content', chatContentPartial);
Handlebars.registerPartial('chat-message', chatMessagePartial);
Handlebars.registerPartial('chat-sidebar-item', chatSidebarItem);

let currentUserId: number | null = null;

Handlebars.registerHelper('eq', (left: unknown, right: unknown) => left === right);
Handlebars.registerHelper('formatTime', (value?: string) => (value ? formatTime(value) : ''));
Handlebars.registerHelper('chatAvatar', (value?: string | null) =>
  value ? getResourceUrl(BASE_URL, value) : '/icon.svg',
);

type ChatItem = {
  id: number;
  title: string;
  avatar: string | null;
  unread_count: number;
  last_message?: { content?: string; time?: string };
};

type ActiveChat = ChatItem;

type RawChatMessage = {
  type?: string;
  content?: unknown;
  time?: unknown;
  user_id?: number;
  file?: { path?: string };
};

type ChatMessage = {
  id: string;
  text: string;
  image: string;
  time: string;
  isOwn: boolean;
};

type ChatPageProps = BlockProps & {
  chats?: ChatItem[];
  activeChat?: ActiveChat | null;
  activeChatId?: number | null;
  messages?: ChatMessage[];
  params?: Record<string, string>;
  pathname?: string;
  events?: Record<string, EventListener>;
};

export default class ChatPage extends Block<ChatPageProps> {
  private _components: Record<string, Input | Button> = {};
  private _componentsInitialized = false;
  private _userId: number | null = null;
  private _socket: ChatSocket | null = null;
  private _resourcePaths: Map<number, string> = new Map();
  private _authChecked = false;

  constructor(tagName: string = 'div', props: BlockProps = {}) {
    const typedProps = props as ChatPageProps;
    super(tagName, {
      ...typedProps,
      chats: typedProps.chats ?? [],
      activeChat: typedProps.activeChat ?? null,
      activeChatId: typedProps.activeChatId ?? null,
      messages: typedProps.messages ?? [],
    });
    const mergedEvents = {
      ...(typedProps.events ?? {}),
      click: (event: Event) => {
        this._handleChatClick(event as MouseEvent);
      },
      change: (event: Event) => {
        this._handleFileChange(event);
      },
    };
    this.setProps({ events: mergedEvents });
  }

  private _initComponents() {
    if (this._componentsInitialized) {
      return;
    }
    const searchIcon = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="11" cy="11" r="6" stroke="currentColor" stroke-width="2" />
        <line x1="15.4142" y1="15" x2="20" y2="19.5858" stroke="currentColor" stroke-width="2" />
      </svg>
    `;

    const messageInput = new Input({
      name: 'message',
      placeholder: 'Сообщение',
      variant: 'filled',
      className: 'chat-content__input',
    });
    const chatSearch = new Input({
      name: 'search',
      placeholder: 'Поиск',
      variant: 'filled',
      icon: searchIcon,
    });
    this._components = {
      'chat-search': chatSearch,
      'message-input': messageInput,
      'send-button': new Button({
        icon: '/send.svg',
        variant: 'icon',
        className: 'chat-content__send',
        events: {
          click: (event: Event) => {
            event.preventDefault();
            const form = document.querySelector('.chat-content__form') as HTMLFormElement | null;
            if (!form) return;
            this._sendMessage(messageInput.value);
            messageInput.setValue('');
          },
        },
      }),
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
        this.setProps({ activeChatId: null, activeChat: null, messages: [] });
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
    const item = target?.closest('[data-chat-id]') as HTMLElement | null;
    if (!item) return;
    const id = item.dataset.chatId;
    if (!id) return;
    const chatId = Number(id);
    if (!Number.isFinite(chatId)) return;
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
    const response = await this._safeRequest(() => createChat(title), 'create chat');
    if (!response || this._handleAuth(response)) return;
    if (response.status < 200 || response.status >= 300) {
      console.error('create chat error', response.status, response.responseText);
      return;
    }
    await this._loadChats();
  }

  private _setActiveChat(chatId: number, options: { syncUrl: boolean }) {
    if (this.props.activeChatId === chatId && this.props.activeChat) {
      return;
    }
    const chats = this.props.chats ?? [];
    const activeChat = chats.find((chat) => chat.id === chatId) ?? null;
    if (options.syncUrl) {
      window.history.pushState({}, '', `/messenger/${chatId}`);
    }
    const resolvedActiveChat = activeChat ?? null;
    this.setProps({
      activeChatId: chatId,
      activeChat: resolvedActiveChat,
      messages: [],
    });
    if (resolvedActiveChat) {
      void this._connectToChat(chatId);
    }
  }

  private async _loadChats() {
    const response = await this._safeRequest(() => getChats(), 'get chats');
    if (!response || this._handleAuth(response)) return;
    if (response.status < 200 || response.status >= 300) {
      console.error('get chats error', response.status, response.responseText);
      return;
    }

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
    const response = await this._safeRequest(() => uploadResource(file), 'upload file');
    if (!response || this._handleAuth(response)) return;
    if (response.status < 200 || response.status >= 300) {
      console.error('upload file error', response.status, response.responseText);
      return;
    }

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

    await this._loadChatFiles(chatId);
    const response = await this._safeRequest(() => getChatToken(chatId), 'get token');
    if (!response || this._handleAuth(response)) return;
    if (response.status < 200 || response.status >= 300) {
      console.error('get token error', response.status, response.responseText);
      return;
    }

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

    const current = this.props.messages ?? [];
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
    const type = String(message.type ?? '');
    if (type === 'file') {
      const file = message.file;
      const content = String(message.content ?? '');
      const image = file?.path
        ? getResourceUrl(BASE_URL, file.path)
        : getResourceUrl(BASE_URL, content, this._resourcePaths);
      return {
        id: `m-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        image,
        text: '',
        isOwn: message.user_id === currentUserId,
        time: formatTime(String(message.time ?? '')),
      };
    }
    return {
      id: `m-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      text: String(message.content ?? ''),
      image: '',
      isOwn: message.user_id === currentUserId,
      time: formatTime(String(message.time ?? '')),
    };
  }

  private async _loadChatFiles(chatId: number) {
    const response = await this._safeRequest(() => getChatFiles(chatId), 'get chat files');
    if (!response || this._handleAuth(response)) return;
    if (response.status < 200 || response.status >= 300) {
      console.error('get chat files error', response.status, response.responseText);
      return;
    }

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
    const response = await this._safeRequest(() => getUser(), 'get user');
    if (!response || this._handleAuth(response)) return null;
    if (response.status < 200 || response.status >= 300) {
      console.error('get user error', response.status, response.responseText);
      return null;
    }
    const data = JSON.parse(response.responseText) as { id?: number };
    if (typeof data.id === 'number') {
      this._userId = data.id;
      currentUserId = data.id;
      return data.id;
    }
    return null;
  }

  private async _safeRequest(
    request: () => Promise<XMLHttpRequest>,
    label: string,
  ): Promise<XMLHttpRequest | null> {
    try {
      return await request();
    } catch (error) {
      console.error(`${label} request failed`, error);
      return null;
    }
  }

  private _handleAuth(response: XMLHttpRequest) {
    if (this._authChecked) {
      return handleAuthResponse(response);
    }
    this._authChecked = true;
    return handleAuthResponse(response);
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
    const firstChild = root.firstElementChild;
    return firstChild instanceof HTMLElement ? firstChild : root;
  }
}
