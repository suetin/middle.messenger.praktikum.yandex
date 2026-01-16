import Handlebars from 'handlebars';
import chatLayoutTemplate from '../layout/chat.hbs?raw';
import chatSidebarPartial from '../partials/chatSidebar.hbs?raw';
import chatSidebarItem from '../partials/chatSidebarItem.hbs?raw';
import chatContentPartial from '../partials/chatContent.hbs?raw';
import chatMessagePartial from '../partials/chatMessage.hbs?raw';
import Block from '../lib/Block';
import type { BlockProps } from '../lib/Block';
import Router from '../lib/router/Router';
import HTTPTransport from '../lib/HTTPTransport';
import { renderWithComponents } from '../lib/render';
import Input from '../components/Input';
import Button from '../components/Button';
import { createHandleBlur, validateAndDisplayErrors } from '../lib/validationHandlers';
import type { InputsMap } from '../lib/validationHandlers';

Handlebars.registerPartial('chat-sidebar', chatSidebarPartial);
Handlebars.registerPartial('chat-content', chatContentPartial);
Handlebars.registerPartial('chat-message', chatMessagePartial);
Handlebars.registerPartial('chat-sidebar-item', chatSidebarItem);

type ChatItem = {
  id: number;
  title: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: number;
  isActive: boolean;
};

type ActiveChat = {
  title: string;
  status?: string;
  avatar: string;
  messages: Array<{
    id: string;
    text?: string;
    image?: string;
    time: string;
    isOwn: boolean;
  }>;
};

type ChatPageProps = BlockProps & {
  chats?: ChatItem[];
  activeChat?: ActiveChat | null;
  activeChatId?: number | null;
  params?: Record<string, string>;
  pathname?: string;
  events?: Record<string, EventListener>;
};

const BASE_URL = 'https://ya-praktikum.tech/api/v2';
const chatApi = new HTTPTransport();

export default class ChatPage extends Block<ChatPageProps> {
  private _inputsByName: InputsMap | null = null;
  private _components: Record<string, Input | Button> = {};
  private _componentsInitialized = false;

  constructor(tagName: string = 'div', props: BlockProps = {}) {
    const typedProps = props as ChatPageProps;
    super(tagName, {
      ...typedProps,
      chats: typedProps.chats ?? [],
      activeChat: typedProps.activeChat ?? null,
      activeChatId: typedProps.activeChatId ?? null,
    });
    const mergedEvents = {
      ...(typedProps.events ?? {}),
      click: (event: Event) => {
        this._handleChatClick(event as MouseEvent);
      },
    };
    this.setProps({ events: mergedEvents });
  }

  private _initComponents() {
    if (this._componentsInitialized) {
      return;
    }
    if (!this._inputsByName) {
      this._inputsByName = {};
    }
    const inputsByName = this._inputsByName;
    const handleBlur = createHandleBlur(inputsByName);

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
      events: {
        focusout: handleBlur('message'),
      },
    });
    inputsByName.message = messageInput;

    const chatSearch = new Input({
      name: 'search',
      placeholder: 'Поиск',
      variant: 'filled',
      icon: searchIcon,
      events: {
        focusout: handleBlur('search'),
      },
    });
    inputsByName.search = chatSearch;

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
            if (!validateAndDisplayErrors(form, inputsByName)) return;
            console.log('send message', messageInput.value);
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
        this.setProps({ activeChatId: null, activeChat: null });
      }
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
    const item = target?.closest('[data-chat-id]') as HTMLElement | null;
    if (!item) return;
    const id = item.dataset.chatId;
    if (!id) return;
    const chatId = Number(id);
    if (!Number.isFinite(chatId)) return;
    this._setActiveChat(chatId, { syncUrl: true });
  };

  private _setActiveChat(chatId: number, options: { syncUrl: boolean }) {
    if (this.props.activeChatId === chatId) {
      return;
    }
    const chats = (this.props.chats ?? []).map((chat) => ({
      ...chat,
      isActive: chat.id === chatId,
    }));
    const activeChat = chats.find((chat) => chat.id === chatId) ?? null;
    if (options.syncUrl) {
      const router = new Router('#app');
      router.go(`/messenger/${chatId}`);
    }
    this.setProps({
      chats,
      activeChatId: chatId,
      activeChat: activeChat
        ? {
            title: activeChat.title,
            avatar: activeChat.avatar,
            messages: [],
          }
        : null,
    });
  }

  private async _loadChats() {
    try {
      const response = await chatApi.get(`${BASE_URL}/chats`, {
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.status === 401) {
        const router = new Router('#app');
        router.setAuth(false);
        router.go('/');
        return;
      }

      if (response.status < 200 || response.status >= 300) {
        console.error('get chats error', response.status, response.responseText);
        return;
      }

      const data = JSON.parse(response.responseText) as Array<{
        id: number;
        title: string;
        avatar: string | null;
        unread_count: number;
        last_message?: { content?: string; time?: string };
      }>;

      const chats = data.map((item) => ({
        id: item.id,
        title: item.title,
        avatar: item.avatar ? `${BASE_URL}/resources/${item.avatar}` : '/icon.svg',
        lastMessage: item.last_message?.content ?? '',
        time: item.last_message?.time ? this._formatTime(item.last_message.time) : '',
        unread: item.unread_count ?? 0,
        isActive: false,
      }));

      this.setProps({ chats });
      this._applyActiveFromParams();
    } catch (error) {
      console.error('get chats request failed', error);
    }
  }

  private _formatTime(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  }

  render() {
    this._initComponents();
    const root = document.createElement('div');
    renderWithComponents(chatLayoutTemplate, this.props, this._components, root);
    const firstChild = root.firstElementChild;
    return firstChild instanceof HTMLElement ? firstChild : root;
  }
}
