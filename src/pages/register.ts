import Block from '../lib/Block';
import Router from '../lib/router/Router';
import HTTPTransport from '../lib/HTTPTransport';
import registerLayoutTemplate from '../layout/register.hbs?raw';
import { renderWithComponents } from '../lib/render';
import Input from '../components/Input';
import Button from '../components/Button';
import { createHandleBlur, validateAndDisplayErrors } from '../lib/validationHandlers';
import type { InputsMap } from '../lib/validationHandlers';
import { BASE_URL } from '../api/base';

const data = {
  fields: [
    { label: 'Имя', name: 'first_name', type: 'text' },
    { label: 'Фамилия', name: 'second_name', type: 'text' },
    { label: 'Логин', name: 'login', type: 'text' },
    { label: 'Почта', name: 'email', type: 'text' },
    { label: 'Пароль', name: 'password', type: 'password' },
    { label: 'Телефон', name: 'phone', type: 'text' },
  ],
};

const authApi = new HTTPTransport();

export default class RegisterPage extends Block {
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
        variant: 'underline',
        events: {
          focusout: handleBlur(field.name),
        },
      });
      inputsByName[field.name] = input;
      acc[`field-${field.name}`] = input;
      return acc;
    }, {});

    const registerButton = new Button({
      text: 'Зарегистрироваться',
      fullWidth: true,
      events: {
        click: async (event: Event) => {
          event.preventDefault();
          const form = document.getElementById('register-form') as HTMLFormElement | null;
          if (!form) return;
          if (!validateAndDisplayErrors(form, inputsByName)) return;
          const formData = new FormData(form);
          const payload = Object.fromEntries(
            Array.from(formData.entries()).map(([key, value]) => [key, String(value)]),
          );

          try {
            const response = await authApi.post(`${BASE_URL}/auth/signup`, {
              headers: { 'Content-Type': 'application/json' },
              data: JSON.stringify(payload),
            });

            if (response.status >= 200 && response.status < 300) {
              const router = Router.getInstance('#app');
              router.setAuth(true);
              router.go('/messenger');
              return;
            }

            let message = 'Ошибка регистрации';
            try {
              const data = JSON.parse(response.responseText) as { reason?: string };
              if (data.reason) {
                message = data.reason;
              }
            } catch {
              // ignore JSON parse errors
            }
            console.error('register error', response.status, response.responseText);
            alert(message);
          } catch (error) {
            console.error('register request failed', error);
            alert('Сеть недоступна. Попробуйте позже.');
          }
        },
      },
    });

    this._components = {
      ...inputComponents,
      'register-button': registerButton,
    };
    this._componentsInitialized = true;
  }

  render() {
    this._initComponents();
    const root = document.createElement('div');
    renderWithComponents(registerLayoutTemplate, data, this._components, root);
    const firstChild = root.firstElementChild;
    return firstChild instanceof HTMLElement ? firstChild : root;
  }
}
