import Handlebars from 'handlebars';
import profileLayoutTemplate from '../layout/profile.hbs?raw';
import backToTemplate from '../partials/backTo.hbs?raw';
import avatarFormTemplate from '../partials/avatarForm.hbs?raw';
import Block from '../lib/Block';

Handlebars.registerPartial('back-to', backToTemplate);
Handlebars.registerPartial('avatar-form', avatarFormTemplate);
const template = Handlebars.compile(profileLayoutTemplate);

const data = {
  avatar: 'https://i.pravatar.cc/180?img=8',
  name: 'Иван',
  fields: [
    { label: 'Почта', name: 'email', value: 'pochta@yandex.ru', type: 'text' },
    { label: 'Логин', name: 'login', value: 'ivanivanov', type: 'text' },
    { label: 'Имя', name: 'first_name', value: 'Иван', type: 'text' },
    { label: 'Фамилия', name: 'second_name', value: 'Иванов', type: 'text' },
    { label: 'Имя в чате', name: 'display_name', value: 'Иван', type: 'text' },
    { label: 'Телефон', name: 'phone', value: '+7 (909) 967 30 30', type: 'text' },
  ],
};

export default class ProfilePage extends Block {
  render() {
    const html = template(data).trim();
    const tpl = document.createElement('template');
    tpl.innerHTML = html;
    const firstChild = tpl.content.firstElementChild;
    return firstChild instanceof HTMLElement ? firstChild : '';
  }

  componentDidMount() {
    const root = this.getContent();
    const avatarOpenForm = root.querySelector('.js-avatar-form, .js-avatar-open-form');
    const avatarModal = root.querySelector('.js-avatar-modal');

    if (avatarOpenForm && avatarModal) {
      avatarOpenForm.addEventListener('click', () => {
        avatarModal.classList.toggle('avatar-modal--open');
      });

      avatarModal.addEventListener('click', (event) => {
        if (event.target === avatarModal) {
          avatarModal.classList.remove('avatar-modal--open');
        }
      });
    }
  }
}
