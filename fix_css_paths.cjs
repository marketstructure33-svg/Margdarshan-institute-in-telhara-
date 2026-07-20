const fs = require('fs');
let code = fs.readFileSync('src/components/sections/PdfSection.tsx', 'utf8');

code = code.replace("import 'react-pdf/dist/esm/Page/AnnotationLayer.css';", "import 'react-pdf/dist/Page/AnnotationLayer.css';");
code = code.replace("import 'react-pdf/dist/esm/Page/TextLayer.css';", "import 'react-pdf/dist/Page/TextLayer.css';");

fs.writeFileSync('src/components/sections/PdfSection.tsx', code);
