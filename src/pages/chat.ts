import Handlebars from 'handlebars';
import chatLayoutTemplate from '../layout/chat.hbs?raw';
import chatSidebarPartial from '../partials/chatSidebar.hbs?raw';
import chatSidebarItem from '../partials/chatSidebarItem.hbs?raw';
import chatContentPartial from '../partials/chatContent.hbs?raw';
import chatMessagePartial from '../partials/chatMessage.hbs?raw';
import Block from '../lib/Block';
import { renderWithComponents } from '../lib/render';
import Input from '../components/Input';
import Button from '../components/Button';
import { createHandleBlur, validateAndDisplayErrors } from '../lib/validationHandlers';
import type { InputsMap } from '../lib/validationHandlers';

Handlebars.registerPartial('chat-sidebar', chatSidebarPartial);
Handlebars.registerPartial('chat-content', chatContentPartial);
Handlebars.registerPartial('chat-message', chatMessagePartial);
Handlebars.registerPartial('chat-sidebar-item', chatSidebarItem);

const templateData = {
  chats: [
    {
      id: 1,
      title: 'Марина',
      lastMessage: 'Привет, как дела?',
      time: '09:18',
      unread: 2,
      avatar: 'https://i.pravatar.cc/80?img=30',
      isActive: true,
    },
    {
      id: 2,
      title: 'Иван',
      lastMessage: 'Созвонимся в 11:00?',
      time: '08:52',
      unread: 0,
      avatar: 'https://i.pravatar.cc/80?img=59',
      isActive: false,
    },
    {
      id: 3,
      title: 'Дмитрий',
      lastMessage: 'lorem ipsum dolor sit amet consectetur adipisicing elit. Quae, officia?',
      time: '08:40',
      unread: 5,
      avatar: 'https://i.pravatar.cc/80?img=8',
      isActive: false,
    },
  ],
  activeChat: {
    title: 'Марина',
    status: 'Сейчас в сети',
    avatar: 'https://i.pravatar.cc/80?img=30',
    messages: [
      {
        id: 'm1',
        text: 'Привет! Обновила макет регистрации, добавила подсказки.',
        time: '09:05',
        isOwn: false,
      },
      {
        id: 'm2',
        text: 'Отлично, спасибо. Посмотрю и отпишусь команде.',
        time: '09:10',
        isOwn: true,
      },
      {
        id: 'm3',
        text: 'Какая камера интересная',
        image: '/preview.png',
        time: '09:12',
        isOwn: false,
      },
      {
        id: 'm4',
        text: 'Привет, как дела?',
        time: '09:14',
        isOwn: true,
      },
    ],
  },
};

export default class ChatPage extends Block {
  private _inputsByName: InputsMap = {};
  private _components: Record<string, Input | Button> = {};
  private _componentsInitialized = false;

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

  render() {
    this._initComponents();
    const root = document.createElement('div');
    renderWithComponents(chatLayoutTemplate, templateData, this._components, root);
    return root.firstElementChild ?? root;
  }
}
