import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import fs from 'fs';

const requiredPublicAssets = [
  'icon-16.png',
  'icon-32.png',
  'icon-48.png',
  'icon-128.png',
];

export default defineConfig({
  base: './',
  plugins: [
    react(),
    {
      name: 'copy-extension-files',
      closeBundle() {
        for (const asset of requiredPublicAssets) {
          if (!fs.existsSync(resolve(__dirname, 'public', asset))) {
            throw new Error(`Missing required extension asset: public/${asset}`);
          }
        }

        // Copy extension-only files after Vite has copied public assets.
        fs.copyFileSync('manifest-react.json', 'dist/manifest.json');
        fs.copyFileSync('src/blocked.html', 'dist/blocked.html');

        // Move HTML files from dist/src/ to dist/ and fix paths
        try {
          // Read and fix popup.html
          let popupHtml = fs.readFileSync('dist/src/popup/index.html', 'utf8');
          popupHtml = popupHtml.replace(/src="[\.\/]*popup\.js"/g, 'src="./popup.js"');
          popupHtml = popupHtml.replace(/href="[\.\/]*js\//g, 'href="./js/');
          popupHtml = popupHtml.replace(/href="[\.\/]*popup\.css"/g, 'href="./popup.css"');
          fs.writeFileSync('dist/popup.html', popupHtml);

          // Read and fix options.html
          let optionsHtml = fs.readFileSync('dist/src/options/index.html', 'utf8');
          optionsHtml = optionsHtml.replace(/src="[\.\/]*options\.js"/g, 'src="./options.js"');
          optionsHtml = optionsHtml.replace(/href="[\.\/]*js\//g, 'href="./js/');
          optionsHtml = optionsHtml.replace(/href="[\.\/]*options\.css"/g, 'href="./options.css"');
          fs.writeFileSync('dist/options.html', optionsHtml);

          console.log('HTML files moved to root dist directory with fixed paths');
        } catch (e) {
          console.log('HTML files not found, skipping move...', e);
        }
      }
    }
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/popup/index.html'),
        options: resolve(__dirname, 'src/options/index.html'),
        background: resolve(__dirname, 'src/background/background.ts'),
        content: resolve(__dirname, 'src/content/content.ts'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'js/[name].[hash].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) {
            return '[name].css';
          }
          if (assetInfo.name?.endsWith('.html')) {
            return '[name].[ext]';
          }
          return '[name].[ext]';
        },
      },
    },
    target: 'chrome91',
    minify: false,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
