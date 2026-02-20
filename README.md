# Яндекс.Практикум «Мессенджер»

---

Проект в рамках обучения «Мидл фронтенд-разработчик»

- За основу взят дизайн предлагаемый в программе обучения, но с небольшой кастомизацией: [ссылка на макет](https://www.figma.com/design/gLHYNqXiPgc3YOMbNae00Q/a.suetin_practicum_chat?node-id=1-600&t=lWbPUy4CfXSVnXL5-1)
- На данном этапе проект хоститься в Netlify: [ссылка на проект](https://remarkable-ganache-20b43c.netlify.app/)
- Технологии: Handlebars, Vite, PostCSS, ESLint, Prettier, TypeScript, Vitest
- В рамках первого спринта сверстаны основные страницы и настроена сборка проекта.
- В рамках второго спринта добавлен функционал реактивности (Block, EventBus), частично реализован компонентный подход, правила валидации полей.
- В рамках третьего стринта реализован роутер и API чата.
- В рамках четвертого спринта написаны тесты для Block, HTTPTransport, Router, обновлены зависимости, проведен pnpm audit (No known vulnerabilities found)

#### Страницы

- [Чат](https://remarkable-ganache-20b43c.netlify.app/messenger)
- [Профиль](https://remarkable-ganache-20b43c.netlify.app/settings)
- [Изменение данных](https://remarkable-ganache-20b43c.netlify.app/settings/edit)
- [Изменение пароля](https://remarkable-ganache-20b43c.netlify.app/settings/password)
- [Авторизация](https://remarkable-ganache-20b43c.netlify.app/)
- [Регистрация](https://remarkable-ganache-20b43c.netlify.app/sign-up)
- [404](https://remarkable-ganache-20b43c.netlify.app/404)
- [500](https://remarkable-ganache-20b43c.netlify.app/500)

## Установка

Клонировать проект:

```
git clone https://github.com/suetin/middle.messenger.praktikum.yandex.git .
```

Установка зависимостей:

```
npm install
```

Запуск dev-сервера:

```
npm run dev
```

Сборка:

```
npm run build
```

Предпросмотр собранной версии:

```
npm run preview
```

## Тесты

Запуск тестов в режиме watch:

```
npm run test
```

Одноразовый прогон тестов:

```
npm run test:run
```
