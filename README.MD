# Progressive Web Apps - Complete Guide

This source code is based on Maximilian Schwarzmüller's
"Progressive Web Apps - Complete Guide" course on udemy.com.

## Notes

Use:

- `npm install -g firebase-tools`
- `firebase init`
  - select functions and hosting
- `firebase deploy` - to deploy once code added to the functions directory
- `npm install web-push` and `npx web-push generate-vapid-keys` for keys
- for workbox
  - `npm run sw:setup` - one time run to create a workbox-config.js
  - `npm run sw:gen` - generate a service worker (sw) using workbox-config.js
  - `npm run sw:inject` - gen a sw using workbox-config.js and a sw tempale
- `firebase deploy` in the root directory will put the public dir on fb hosting
