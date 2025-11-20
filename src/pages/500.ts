import '../styles/style.css';
import Handlebars from 'handlebars';
import errorPage from '../partials/serverError.hbs?raw';

const template = Handlebars.compile(errorPage);

const appEl = document.getElementById('app');
if (appEl) {
  appEl.innerHTML = template({
    code: '500',
    message: 'Мы уже фиксим',
    backUrl: '/chat.html',
    backText: 'Назад к чатам',
  });
}
