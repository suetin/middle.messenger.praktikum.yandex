import { defineConfig } from 'vite';
export default defineConfig({
  appType: 'spa',
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
