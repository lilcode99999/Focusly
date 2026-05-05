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

interface ExtensionManifest {
  manifest_version?: number;
  action?: {
    default_popup?: string;
    default_icon?: Record<string, string>;
  };
  background?: {
    service_worker?: string;
  };
  content_scripts?: {
    js?: string[];
    css?: string[];
  }[];
  icons?: Record<string, string>;
  options_page?: string;
}

const distPath = (...paths: string[]) => resolve(__dirname, 'dist', ...paths);

const readManifest = (): ExtensionManifest => (
  JSON.parse(fs.readFileSync(distPath('manifest.json'), 'utf8')) as ExtensionManifest
);

const assertDistFile = (filePath: string, label = filePath) => {
  if (!filePath || filePath.startsWith('http')) {
    return;
  }

  if (!fs.existsSync(distPath(filePath))) {
    throw new Error(`Missing ${label}: dist/${filePath}`);
  }
};

const collectManifestReferences = (manifest: ExtensionManifest): string[] => {
  const references = [
    manifest.action?.default_popup,
    manifest.background?.service_worker,
    manifest.options_page,
    ...Object.values(manifest.action?.default_icon || {}),
    ...Object.values(manifest.icons || {}),
  ];

  for (const script of manifest.content_scripts || []) {
    references.push(...(script.js || []), ...(script.css || []));
  }

  return Array.from(new Set(references.filter((path): path is string => Boolean(path))));
};

const validateExtensionBundle = () => {
  assertDistFile('manifest.json');
  assertDistFile('blocked.html');

  const manifest = readManifest();
  if (manifest.manifest_version !== 3) {
    throw new Error('dist/manifest.json must declare Manifest V3');
  }

  if (!manifest.action?.default_popup) {
    throw new Error('dist/manifest.json is missing action.default_popup');
  }
  if (!manifest.background?.service_worker) {
    throw new Error('dist/manifest.json is missing background.service_worker');
  }
  if (!manifest.options_page) {
    throw new Error('dist/manifest.json is missing options_page');
  }

  const references = collectManifestReferences(manifest);
  for (const reference of references) {
    assertDistFile(reference, `manifest reference ${reference}`);
  }

  console.log(`Verified ${references.length} Manifest V3 references in dist/`);
};

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

        validateExtensionBundle();
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
