const fs = require('fs');
let code = fs.readFileSync('vite.config.ts', 'utf8');
code = code.replace("import {defineConfig} from 'vite';", "import {defineConfig} from 'vite';\nimport { VitePWA } from 'vite-plugin-pwa';");
code = code.replace("plugins: [react(), tailwindcss()],", `plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        manifest: {
          name: 'Margdarshan Institute',
          short_name: 'Margdarshan',
          description: 'Margdarshan Institute Web App',
          theme_color: '#ffffff'
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg}']
        }
      })
    ],`);
fs.writeFileSync('vite.config.ts', code);
