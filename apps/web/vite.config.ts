import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// `base: './'` hace que los assets se referencien de forma relativa, así el
// build funciona igual en la raíz (dominio propio) que bajo el subpath de
// GitHub Pages (https://usuario.github.io/repo/) sin saber el nombre del repo.
export default defineConfig({
  base: process.env.VITE_BASE ?? './',
  plugins: [react()],
  server: {
    port: 5173,
  },
});
