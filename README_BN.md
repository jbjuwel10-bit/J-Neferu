# J`Neferu — Gemini + Telegram (শুরুর সংস্করণ)

এটি একটি ছোট পরীক্ষামূলক Telegram AI bot। এটি Telegram-এর webhook থেকে মেসেজ নেয় এবং Gemini API দিয়ে উত্তর তৈরি করে।

## গুরুত্বপূর্ণ নিরাপত্তা
- `TELEGRAM_BOT_TOKEN`, `GEMINI_API_KEY`, `TELEGRAM_WEBHOOK_SECRET` কখনো GitHub-এ বা চ্যাটে প্রকাশ করবে না।
- Hosting-এর Environment Variables-এ গোপনে রাখবে।
- Gemini free tier-এর সীমা আছে। Free tier-এ পাঠানো কনটেন্ট Google-এর পণ্য উন্নত করতে ব্যবহার হতে পারে—ব্যক্তিগত/সংবেদনশীল তথ্য পাঠিও না।
- এই সংস্করণ শুধু Telegram bot-এর জন্য; WhatsApp বা Messenger এখনো যুক্ত নয়।
- এটি পরীক্ষামূলক; ২৪/৭ নিরবচ্ছিন্ন চলার নিশ্চয়তা নেই।

## Hosting-এ লাগবে
- Node.js 20+
- Build command: `npm install`
- Start command: `npm start`
- Environment Variables: `.env.example`-এর মানগুলো hosting dashboard-এ আলাদাভাবে যোগ করবে।

## Deploy করার পর webhook সেট করা
Hosting থেকে পাওয়া HTTPS URL ধরো `https://YOUR-SERVICE.onrender.com`।

ফোনের browser-এ এই URL খোলো (নিজের আসল মান বসিয়ে):
`https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook?url=https://YOUR-SERVICE.onrender.com/telegram/webhook&secret_token=<TELEGRAM_WEBHOOK_SECRET>`

এখানে bot token বা secret কারও সঙ্গে শেয়ার করবে না। URL-টি browser history-তেও থেকে যেতে পারে; কাজ শেষে history মুছে ফেলতে পারো। আরও নিরাপদ পদ্ধতি হলো Telegram setWebhook API-তে POST করা।

## সীমাবদ্ধতা
- কথোপকথনের সাম্প্রতিক ইতিহাস RAM-এ থাকে; সার্ভার restart হলে মুছে যায়।
- Free hosting idle হলে sleep করতে পারে; জেগে উঠতে সময় লাগে।
- এই starter production-ready নয়। বড় পরিসরে ব্যবহারের আগে persistent database, rate limiting, abuse protection, monitoring ও privacy controls দরকার।
