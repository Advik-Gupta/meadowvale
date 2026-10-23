import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
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
