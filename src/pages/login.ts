import '../styles/style.css';
import Handlebars from 'handlebars';
import profileLayoutTemplate from '../layout/profile.hbs?raw';
import backTemplate from '../partials/backTo.hbs?raw';

Handlebars.registerPartial('back-to', backTemplate);
Handlebars.registerPartial('user-prifile', profileLayoutTemplate);

const template = Handlebars.compile(profileLayoutTemplate);

const templateData = {
  name: 'Дмитрий',
  avatar: 'https://i.pravatar.cc/80?img=8',
  email: 'V8V8H@example.com',
};

const appEl = document.getElementById('app');
if (appEl) {
  appEl.innerHTML = template(templateData);
}
