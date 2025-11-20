import '../styles/style.css';
import '../styles/profile.css';
import Handlebars from 'handlebars';
import profileLayoutTemplate from '../layout/profile.hbs?raw';
import backToTemplate from '../partials/backTo.hbs?raw';
import avatarFormTemplate from '../partials/avatarForm.hbs?raw';

Handlebars.registerPartial('back-to', backToTemplate);
Handlebars.registerPartial('avatar-form', avatarFormTemplate);
const template = Handlebars.compile(profileLayoutTemplate);

const data = {
  avatar: 'https://i.pravatar.cc/180?img=8',
  name: 'Иван',
  fields: [
    { label: 'Почта', name: 'email', value: 'pochta@yandex.ru', type: 'text' },
    { label: 'Логин', name: 'login', value: 'ivanivanov', type: 'text' },
    { label: 'Имя', name: 'first_name', value: 'Иван', type: 'text' },
    { label: 'Фамилия', name: 'second_name', value: 'Иванов', type: 'text' },
    { label: 'Имя в чате', name: 'display_name', value: 'Иван', type: 'text' },
    { label: 'Телефон', name: 'phone', value: '+7 (909) 967 30 30', type: 'text' },
  ],
  fieldsPassword: [
    { label: 'Старый пароль', name: 'oldPassword', type: 'password', value: '111' },
    { label: 'Новый пароль', name: 'newPassword', type: 'password', value: '111' },
    { label: 'Повторите новый пароль', name: 'newPasswordRepeat', type: 'password', value: '111' },
  ],
};

const appEl = document.getElementById('app');
if (appEl) {
  appEl.innerHTML = template(data);
}

const avatarOpenForm = document.querySelector('.js-avatar-form, .js-avatar-open-form');
const avatarModal = document.querySelector('.js-avatar-modal');

if (avatarOpenForm && avatarModal) {
  avatarOpenForm.addEventListener('click', () => {
    avatarModal.classList.toggle('avatar-modal--open');
  });

  avatarModal.addEventListener('click', (event) => {
    if (event.target === avatarModal) {
      avatarModal.classList.remove('avatar-modal--open');
    }
  });
}

const profileInfoSection = document.querySelector('.js-profile-info');
const profileEditSection = document.querySelector('.js-profile-info-edit');
const profilePasswordSection = document.querySelector('.js-profile-password-edit');

const profileEditBtn = document.querySelector('.js-profile-edit-btn');
const profilePasswordBtn = document.querySelector('.js-profile-password-btn');

const hideAllSections = () => {
  [profileInfoSection, profileEditSection, profilePasswordSection].forEach((section) => {
    section?.classList.add('hidden');
  });
};

const showSection = (section: Element | null) => {
  hideAllSections();
  section?.classList.remove('hidden');
};

showSection(profileInfoSection);

profileEditBtn?.addEventListener('click', () => showSection(profileEditSection));
profilePasswordBtn?.addEventListener('click', () => showSection(profilePasswordSection));
