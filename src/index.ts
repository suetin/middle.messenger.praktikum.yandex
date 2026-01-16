import './styles/app.css';
import Router from './lib/router/Router';
import HTTPTransport from './lib/HTTPTransport';
import ChatPage from './pages/chat';
import LoginPage from './pages/login';
import RegisterPage from './pages/register';
import ProfilePage from './pages/profile';
import ProfileEditPage from './pages/profileEdit';
import ProfilePasswordPage from './pages/profilePassword';
import NotFoundPage from './pages/404';
import ServerErrorPage from './pages/500';

const router = new Router('#app');
const BASE_URL = 'https://ya-praktikum.tech/api/v2';
const authApi = new HTTPTransport();

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
  .setAuthGuard({
    protectedPaths: ['/messenger', '/settings'],
    guestOnlyPaths: ['/', '/sign-up'],
    redirectTo: '/',
    redirectAuthedTo: '/messenger',
  });

(async () => {
  try {
    const response = await authApi.get(`${BASE_URL}/auth/user`);
    router.setAuth(response.status >= 200 && response.status < 300);
  } catch {
    router.setAuth(false);
  }
  router.start();
})();
