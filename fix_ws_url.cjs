const fs = require('fs');

let file = 'src/components/sections/LiveTutorSection.tsx';
if (fs.existsSync(file)) {
  let code = fs.readFileSync(file, 'utf8');

  code = code.replace(
    /const wsUrl = \`\$\{protocol\}\/\/\$\{window\.location\.host\}\/live\?apiKey=\$\{apiKey\}\`;/,
    'const wsUrl = `${protocol}//${window.location.host}/live${apiKey ? "?apiKey=" + apiKey : ""}`;'
  );

  fs.writeFileSync(file, code);
}
