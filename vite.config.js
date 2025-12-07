import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({

  build: {
    outDir: 'dist', // Output to a 'dist' folder inside the project
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'index.html'),
        auth: resolve(__dirname, 'auth.html'),
        pet: resolve(__dirname, 'pet.html'),
        settings: resolve(__dirname, 'settings.html'),
        home: resolve(__dirname, 'home.html'),
      },
    },
  },
});