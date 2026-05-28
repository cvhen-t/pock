import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  resolve: {
    // Prefer .ts over stray compiled .js in src/
    extensions: ['.mjs', '.ts', '.tsx', '.js', '.jsx', '.json'],
  },
  server: {
    host: true,
    port: 5173,
  },
  preview: {
    host: true,
    port: 4173,
  },
});
