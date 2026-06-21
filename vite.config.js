import { defineConfig } from 'vite';
import { resolve } from 'path';
import fs from 'fs';

// Get all HTML files to use as entry points
const htmlFiles = fs.readdirSync('./').filter(file => file.endsWith('.html'));
const input = Object.fromEntries(
  htmlFiles.map(file => [
    file.replace('.html', ''),
    resolve(__dirname, file)
  ])
);

export default defineConfig({
  build: {
    rollupOptions: {
      input,
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]'
      }
    }
  },
  server: {
    port: 5500,
    host: '0.0.0.0',
    open: 'index.html'
  }
});
