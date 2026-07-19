const fs = require('fs');

let code = fs.readFileSync('src/components/sections/LiveTutorSection.tsx', 'utf8');

code = code.replace(
`    if (audioContextRef.current) {
      audioContextRef.current.close();
    }`,
`    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
    }`
);

code = code.replace(
`        if (msg.interrupted) {
          if (window.outputAudioCtx) {
             window.outputAudioCtx.close();
             window.outputAudioCtx = null;
          }
        }`,
`        if (msg.interrupted) {
          if (window.outputAudioCtx && window.outputAudioCtx.state !== 'closed') {
             window.outputAudioCtx.close().catch(() => {});
             window.outputAudioCtx = null;
          }
        }`
);

code = code.replace(
`    if (window.outputAudioCtx) {
      window.outputAudioCtx.close();
      window.outputAudioCtx = null;
    }`,
`    if (window.outputAudioCtx && window.outputAudioCtx.state !== 'closed') {
      window.outputAudioCtx.close().catch(() => {});
      window.outputAudioCtx = null;
    }`
);

fs.writeFileSync('src/components/sections/LiveTutorSection.tsx', code);
