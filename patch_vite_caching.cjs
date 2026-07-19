const fs = require('fs');
let code = fs.readFileSync('vite.config.ts', 'utf8');

const runtimeCachingStr = `          maximumFileSizeToCacheInBytes: 5000000,
          runtimeCaching: [
            {
              urlPattern: /^https:\\/\\/firebasestorage\\.googleapis\\.com\\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'firebase-storage-cache',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              urlPattern: /^https:\\/\\/firestore\\.googleapis\\.com\\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'firestore-data-cache',
                expiration: {
                  maxEntries: 200,
                  maxAgeSeconds: 60 * 60 * 24 * 7 // 1 week
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            }
          ]`;

code = code.replace("maximumFileSizeToCacheInBytes: 5000000", runtimeCachingStr);
fs.writeFileSync('vite.config.ts', code);
