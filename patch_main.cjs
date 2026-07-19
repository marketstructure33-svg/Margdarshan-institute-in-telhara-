const fs = require('fs');
let code = fs.readFileSync('src/main.tsx', 'utf8');

if (!code.includes('virtual:pwa-register')) {
  code = "import { registerSW } from 'virtual:pwa-register';\n" + code;
  code += "\nregisterSW({ immediate: true });\n";
  fs.writeFileSync('src/main.tsx', code);
}
