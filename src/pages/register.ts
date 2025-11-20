import '../styles/style.css';
import Handlebars from 'handlebars';
import registerLayoutTemplate from '../layout/register.hbs?raw';

const template = Handlebars.compile(registerLayoutTemplate);

const appEl = document.getElementById('app');
if (appEl) {
  appEl.innerHTML = template({});
}
