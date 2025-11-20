import '../styles/style.css';
import '../styles/profile.css';
import Handlebars from 'handlebars';
import profileLayoutTemplate from '../layout/profile.hbs?raw';
import backToTemplate from '../partials/backTo.hbs?raw';

Handlebars.registerPartial('back-to', backToTemplate);
const template = Handlebars.compile(profileLayoutTemplate);

const data = {
  avatar: 'https://i.pravatar.cc/180?img=8',
  name: 'Иван',
  fields: [
    { label: 'Почта', value: 'pochta@yandex.ru', type: 'text' },
    { label: 'Логин', value: 'ivanivanov', type: 'text' },
    { label: 'Имя', value: 'Иван', type: 'text' },
    { label: 'Фамилия', value: 'Иванов', type: 'text' },
    { label: 'Имя в чате', value: 'Иван', type: 'text' },
    { label: 'Телефон', value: '+7 (909) 967 30 30', type: 'text' },
  ],
};

const appEl = document.getElementById('app');
if (appEl) {
  appEl.innerHTML = template(data);
}
