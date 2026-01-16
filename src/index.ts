import './styles/app.css';
import Router from './lib/router/Router';
import ChatPage from './pages/chat';
import LoginPage from './pages/login';
import RegisterPage from './pages/register';
import ProfilePage from './pages/profile';
import ProfileEditPage from './pages/profileEdit';
import ProfilePasswordPage from './pages/profilePassword';
import NotFoundPage from './pages/404';
import ServerErrorPage from './pages/500';

const router = new Router('#app');

router
  .use('/', LoginPage)
  .use('/sign-up', RegisterPage)
  .use('/settings', ProfilePage)
  .use('/settings/edit', ProfileEditPage)
  .use('/settings/password', ProfilePasswordPage)
  .use('/messenger', ChatPage)
  .use('/404', NotFoundPage)
  .use('/500', ServerErrorPage)
  .use('*', NotFoundPage)
  .start();
