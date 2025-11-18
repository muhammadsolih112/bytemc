# ByteMC Frontend

GitHub Pages uchun frontend. API manzili runtime’da `public/config.json` orqali sozlanadi.

## Ishga tushirish (lokal)
- `npm install`
- `npm run dev`

## Deploy (GitHub Pages)
- `npm run predeploy`
- `npm run deploy`

## API Sozlamasi
- `public/config.json` ichida `apiBaseUrl` ni backend HTTPS URL’ga qo‘ying.
- Misol: `{"apiBaseUrl":"https://bytemc.uz"}`

## Backend
- `server/index.js` Express backend LiteBans DB bilan ishlaydi.
- Backend `.env` faqat serverda bo‘lishi kerak; frontendga sirlar chiqmaydi.