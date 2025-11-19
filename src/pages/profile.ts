import '../styles/style.css';
import '../styles/profile.css';
import Handlebars from 'handlebars';
import profileLayoutTemplate from '../layout/profile.hbs?raw';
import backToTemplate from '../partials/backTo.hbs?raw';

Handlebars.registerPartial('back-to', backToTemplate);
Handlebars.registerPartial('user-profile', profileLayoutTemplate);

const template = Handlebars.compile(profileLayoutTemplate);

const data = {
  avatar: 'https://i.pravatar.cc/180?img=8',
  name: 'Иван',
  fields: [
    { label: 'Почта', value: 'pochta@yandex.ru' },
    { label: 'Логин', value: 'ivanivanov' },
    { label: 'Имя', value: 'Иван' },
    { label: 'Фамилия', value: 'Иванов' },
    { label: 'Имя в чате', value: 'Иван' },
    { label: 'Телефон', value: '+7 (909) 967 30 30' },
  ],
};

const appEl = document.getElementById('app');
if (appEl) {
  appEl.innerHTML = template(data);
}
