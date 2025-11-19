import '../styles/style.css';
import '../styles/home.css';
import Handlebars from 'handlebars';
import homeLayoutTemplate from '../layout/home.hbs?raw';

Handlebars.registerPartial('home-page', homeLayoutTemplate);

const template = Handlebars.compile(homeLayoutTemplate);

const appEl = document.getElementById('app');
if (appEl) {
  appEl.innerHTML = template({});
}
