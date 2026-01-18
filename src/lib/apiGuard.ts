import Router from './router/Router';

export function handleAuthResponse(response: XMLHttpRequest, redirectTo: string = '/') {
  if (response.status !== 401) {
    return false;
  }
  const router = Router.getInstance('#app');
  router.setAuth(false);
  router.go(redirectTo);
  return true;
}
