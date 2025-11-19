import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        chat: resolve(__dirname, 'chat.html'),
        profile: resolve(__dirname, 'profile.html'),
        login: resolve(__dirname, 'login.html'),
      },
    },
  },
});
