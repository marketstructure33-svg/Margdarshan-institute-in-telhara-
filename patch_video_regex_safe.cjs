const fs = require('fs');
let code = fs.readFileSync('src/components/sections/VideoSection.tsx', 'utf8');

const replacement = `
  const getYouTubeEmbedUrl = (url: string) => {
    if (!url) return '';
    try {
      const regExp = /^.*(youtu.be\\/|v\\/|u\\/\\w\\/|embed\\/|watch\\?v=|&v=)([^#&?]*).*/;
      const match = url.match(regExp);
      return (match && match[2].length === 11) ? \`https://www.youtube.com/embed/\${match[2]}\` : url;
    } catch {
      return url;
    }
  };
`;

code = code.replace(
  /const getYouTubeEmbedUrl = \(url: string\) => \{[\s\S]*?return url;\n\s*\}\n\s*\};\n/,
  replacement.trim() + "\n\n"
);

fs.writeFileSync('src/components/sections/VideoSection.tsx', code);
