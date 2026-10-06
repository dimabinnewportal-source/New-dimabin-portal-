import { fileURLToPath } from 'url';
import { resolve, dirname } from 'path';
import { defineConfig } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        about: resolve(__dirname, 'about.html'),
        admissions: resolve(__dirname, 'admissions.html'),
        contact: resolve(__dirname, 'contact.html'),
        portals: resolve(__dirname, 'portals.html'),
        studentLogin: resolve(__dirname, 'student-login.html'),
        lecturerLogin: resolve(__dirname, 'lecturer-login.html'),
        adminLogin: resolve(__dirname, 'admin-login.html'),
      },
    },
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
    hmr: process.env.DISABLE_HMR !== 'true',
    watch: process.env.DISABLE_HMR === 'true' ? null : {},
  },
});
