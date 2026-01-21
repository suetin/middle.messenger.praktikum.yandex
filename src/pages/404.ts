import Handlebars from 'handlebars';
import errorPage from '../partials/serverError.hbs?raw';
import Block from '../lib/Block';

const template = Handlebars.compile(errorPage);

export default class NotFoundPage extends Block {
  render() {
    const html = template({
      code: '404',
      message: 'Не туда попали',
      backUrl: '/messenger',
      backText: 'Назад к чатам',
    }).trim();
    const tpl = document.createElement('template');
    tpl.innerHTML = html;
    const firstChild = tpl.content.firstElementChild;
    return firstChild instanceof HTMLElement ? firstChild : '';
  }
}
