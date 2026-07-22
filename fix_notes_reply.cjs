const fs = require('fs');

let file = 'src/components/sections/NotesSection.tsx';
if (fs.existsSync(file)) {
  let code = fs.readFileSync(file, 'utf8');

  code = code.replace(
    /const replyText = data\.candidates\?\.\[0\]\?\.content\?\.parts\?\.\[0\]\?\.text \|\| "";/g,
    'const replyText = data.quiz || data.explanation || "";'
  );
  
  code = code.replace(
    /const replyTextTutor = data\.candidates\?\.\[0\]\?\.content\?\.parts\?\.\[0\]\?\.text \|\| "";/g,
    'const replyTextTutor = data.explanation || data.quiz || "";'
  );

  fs.writeFileSync(file, code);
}
