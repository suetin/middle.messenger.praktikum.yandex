import Block from '../lib/Block';
import Router from '../lib/router/Router';
import HTTPTransport from '../lib/HTTPTransport';
import Button from '../components/Button';
import Input from '../components/Input';
import { renderWithComponents } from '../lib/render';
import loginPageLayout from '../layout/login.hbs?raw';
import { createHandleBlur, validateAndDisplayErrors } from '../lib/validationHandlers';
import type { InputsMap } from '../lib/validationHandlers';
import { BASE_URL } from '../api/base';

const data = {
  fields: [
    { label: 'Логин', name: 'login', placeholder: 'Введите логин' },
    { label: 'Пароль', name: 'password', type: 'password', placeholder: 'Введите пароль' },
  ],
};

const authApi = new HTTPTransport();

export default class LoginPage extends Block {
  private _inputsByName: InputsMap = {};
  private _components: Record<string, Input | Button> = {};
  private _componentsInitialized = false;

  private _initComponents() {
    if (this._componentsInitialized) {
      return;
    }
    if (!this._inputsByName) {
      this._inputsByName = {};
    }
    const inputsByName = this._inputsByName;
    const handleBlur = createHandleBlur(inputsByName);

    const inputComponents = data.fields.reduce<Record<string, Input>>((acc, field) => {
      const input = new Input({
        label: field.label,
        name: field.name,
        type: field.type,
        placeholder: field.placeholder,
        variant: 'underline',
        events: {
          focusout: handleBlur(field.name),
        },
      });
      inputsByName[field.name] = input;
      acc[`field-${field.name}`] = input;
      return acc;
    }, {});

    const button = new Button({
      text: 'Войти',
      fullWidth: true,
      events: {
        click: async (event: Event) => {
          event.preventDefault();
          const form = document.getElementById('login-form') as HTMLFormElement | null;
          if (!form) return;
          if (!validateAndDisplayErrors(form, inputsByName)) return;
          const formData = new FormData(form);
          const payload = Object.fromEntries(
            Array.from(formData.entries()).map(([key, value]) => [key, String(value)]),
          );

          try {
            const response = await authApi.post(`${BASE_URL}/auth/signin`, {
              headers: { 'Content-Type': 'application/json' },
              data: JSON.stringify(payload),
            });

            if (response.status >= 200 && response.status < 300) {
              const router = Router.getInstance('#app');
              router.setAuth(true);
              router.go('/messenger');
              return;
            }

            let message = 'Ошибка входа';
            try {
              const data = JSON.parse(response.responseText) as { reason?: string };
              if (data.reason) {
                message = data.reason;
              }
            } catch {
              // ignore JSON parse errors
            }
            console.error('login error', response.status, response.responseText);
            alert(message);
          } catch (error) {
            console.error('login request failed', error);
            alert('Сеть недоступна. Попробуйте позже.');
          }
        },
      },
    });

    this._components = {
      ...inputComponents,
      'login-button': button,
    };
    this._componentsInitialized = true;
  }

  render() {
    this._initComponents();
    const root = document.createElement('div');
    renderWithComponents(loginPageLayout, data, this._components, root);
    const firstChild = root.firstElementChild;
    return firstChild instanceof HTMLElement ? firstChild : root;
  }
}
