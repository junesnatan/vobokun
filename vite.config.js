import { defineConfig } from 'vite';

export default defineConfig({
  optimizeDeps: {
    include: [
      'firebase/app',
      'firebase/auth',
      'firebase/firestore',
      'firebase/storage'
    ]
  },
  server: {
    port: 5173,
    host: true
  }
});
