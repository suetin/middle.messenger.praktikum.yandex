import Handlebars from 'handlebars';
import errorPage from '../partials/serverError.hbs?raw';
import Block from '../lib/Block';

const template = Handlebars.compile(errorPage);

export default class ServerErrorPage extends Block {
  render() {
    const html = template({
      code: '500',
      message: 'Мы уже фиксим',
      backUrl: '/chat',
      backText: 'Назад к чатам',
    }).trim();
    const tpl = document.createElement('template');
    tpl.innerHTML = html;
    return tpl.content.firstElementChild ?? '';
  }
}
