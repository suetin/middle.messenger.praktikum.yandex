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
  .use('/', ChatPage)
  .use('/chat', ChatPage)
  .use('/login', LoginPage)
  .use('/register', RegisterPage)
  .use('/profile', ProfilePage)
  .use('/profile-edit', ProfileEditPage)
  .use('/profile-password', ProfilePasswordPage)
  .use('/404', NotFoundPage)
  .use('/500', ServerErrorPage)
  .use('*', NotFoundPage)
  .start();
