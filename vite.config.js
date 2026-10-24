import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: {
    proxy: {
      '/api': 'http://localhost:8787',
      '/ws': { target: 'ws://localhost:8787', ws: true },
    },
  },
  plugins: [{
    name: 'meadowvale-module-entry',
    apply: 'build',
    transformIndexHtml: {
      order: 'pre',
      handler: (html) => html
        .replace(/\s*<script src="src\/[^"]+"><\/script>/g, '')
        .replace('</body>', '  <script type="module" src="/src/main.js"></script>\n</body>'),
    },
  }],
  build: { outDir: 'dist', emptyOutDir: true, chunkSizeWarningLimit: 1500 },
});
