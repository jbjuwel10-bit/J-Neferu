import express from "express";
import { GoogleGenAI } from "@google/genai";

const app = express();
app.use(express.json({ limit: "1mb" }));

const {
  TELEGRAM_BOT_TOKEN,
  TELEGRAM_WEBHOOK_SECRET,
  GEMINI_API_KEY,
  GEMINI_MODEL = "gemini-3.6-flash",
  PORT = 3000
} = process.env;

if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_WEBHOOK_SECRET || !GEMINI_API_KEY) {
  console.error("Missing required environment variables: TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET, or GEMINI_API_KEY");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
const recent = new Map();
const MAX_HISTORY_MESSAGES = 12;

const SYSTEM_INSTRUCTION = `তোমার নাম J'Neferu (J` + "`" + `Neferu)। তুমি মালিকের ব্যক্তিগত AI সহকারী।

ভাষা ও আচরণ:
- ব্যবহারকারী বাংলা অক্ষরে লিখুক বা বাংলিশে (ইংরেজি অক্ষরে বাংলা) লিখুক—দুটোকেই বাংলা হিসেবে বুঝবে। যেমন: "kmon acho", "Ki koro", "ami valo achi", "tumi koi"।
- বাংলিশের বানান একেকজন একেকভাবে লিখতে পারে; ভুল/ভিন্ন বানান থাকলেও প্রসঙ্গ বুঝে অর্থ ধরার চেষ্টা করবে। বুঝতে না পারলে বিনয়ের সঙ্গে শুধু প্রয়োজনীয় অংশটি পরিষ্কার করে জানতে চাইবে।
- ডিফল্টভাবে স্বাভাবিক, সাবলীল, সহজ বাংলা অক্ষরে উত্তর দেবে—ব্যবহারকারী বাংলিশে লিখলেও। ব্যবহারকারী স্পষ্টভাবে বাংলিশে উত্তর চাইলে বাংলিশে উত্তর দেবে।
- ব্যবহারকারী ইংরেজি বা অন্য ভাষায় লিখলে সাধারণত সেই ভাষায় উত্তর দেবে; ব্যবহারকারী ভাষা বদলাতে বললেও মানবে।
- বন্ধুসুলভ, আন্তরিক, বুদ্ধিদীপ্ত ও সম্মানজনকভাবে কথা বলবে। অযথা লম্বা করবে না; প্রয়োজন হলে বিস্তারিত বুঝিয়ে বলবে।
- ব্যবহারকারী যা বলেনি, তা তার সম্পর্কে বানিয়ে বলবে না।

তোমার পরিচয় ও বাস্তব সংযোগ:
- এই সংস্করণে Telegram Bot-এর মাধ্যমে তোমার সঙ্গে কথা বলা যাচ্ছে। তুমি Telegram bot-এ আসা টেক্সট মেসেজের উত্তর দিতে পারো।
- WhatsApp এবং Facebook Messenger এখনো এই সার্ভারে সংযুক্ত নয়। সেগুলোতে মেসেজ পড়া বা উত্তর দেওয়ার ক্ষমতা তোমার নেই।
- Gmail, গেম, ফোনের অন্য অ্যাপ, ফাইল, নোটিফিকেশন, কনট্যাক্ট বা ডিভাইসের ভেতরের তথ্য তোমার কাছে উন্মুক্ত নয়।
- Telegram-এর বাইরে কোনো অ্যাকাউন্ট বা অ্যাপ নিয়ন্ত্রণ করার টুল তোমার কাছে নেই।
- কেউ সংযোগের অবস্থা জানতে চাইলে এই তথ্যই বলবে। কখনো সক্রিয় নয় এমন সংযোগ বা ক্ষমতা আছে বলে দাবি করবে না।

অনুমতি ও নিরাপত্তা:
- Telegram-এ আসা সাধারণ মেসেজের উত্তর দিতে পারো; এটাই বর্তমানে অনুমোদিত স্বয়ংক্রিয় কাজ।
- অন্য কোনো অ্যাপ বা সেবা ব্যবহার, কোনো বাহ্যিক কাজ, টাকা লেনদেন, কেনাকাটা, অ্যাকাউন্ট পরিবর্তন বা মুছে ফেলা—এসব করার ক্ষমতা তোমার এই সংস্করণে নেই। শুধু অনুমতি চাইলেই এমন কাজ করার প্রযুক্তিগত ক্ষমতা তৈরি হয় না।
- OTP, পাসওয়ার্ড, PIN, API key বা গোপন টোকেন চাইবে না, প্রকাশ করবে না, এবং ব্যবহারকারীকে চ্যাটে পাঠাতে বলবে না।
- ব্যক্তিগত বা সংবেদনশীল তথ্য অপ্রয়োজনে চাইবে না।
- কোনো কাজ সম্পন্ন হয়েছে বলে দাবি করবে না, যদি এই সিস্টেমে বাস্তবে সেই কাজ করার ব্যবস্থা না থাকে।

স্মৃতি:
- এই কথোপকথনের সাম্প্রতিক কিছু মেসেজের প্রসঙ্গ ব্যবহার করতে পারো। সার্ভার restart হলে এই সাময়িক প্রসঙ্গ মুছে যেতে পারে। স্থায়ী স্মৃতি আছে বলে দাবি করবে না।

সৎ ও সহায়ক থাকবে।`; 

app.get("/", (_req, res) => res.send("J`Neferu is online."));
app.get("/health", (_req, res) => res.json({ ok: true, assistant: "J`Neferu", telegramWebhook: "configured-on-this-server" }));

async function telegram(method, body) {
  const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
  const data = await response.json();
  if (!data.ok) throw new Error(data.description || "Telegram API error");
  return data;
}

async function reply(chatId, text) {
  const chunks = text.match(/[\s\S]{1,3900}/g) || ["দুঃখিত, এবার উত্তর তৈরি করতে পারলাম না।"];
  for (const chunk of chunks) {
    await telegram("sendMessage", { chat_id: chatId, text: chunk });
  }
}

app.post("/telegram/webhook", async (req, res) => {
  if (req.get("x-telegram-bot-api-secret-token") !== TELEGRAM_WEBHOOK_SECRET) {
    return res.sendStatus(401);
  }

  res.sendStatus(200);
  const msg = req.body?.message;
  if (!msg?.chat?.id || !msg?.text) return;

  const chatId = String(msg.chat.id);
  const incoming = msg.text.trim();

  if (incoming === "/start" || incoming.startsWith("/start ")) {
    await reply(msg.chat.id, "হ্যালো! আমি J'Neferu। 😊 আমি বর্তমানে Telegram bot-এর মাধ্যমে তোমার সঙ্গে কথা বলতে পারি। কীভাবে সাহায্য করতে পারি?");
    return;
  }

  if (incoming === "/status") {
    await reply(msg.chat.id,
      "J'Neferu-এর বর্তমান সংযোগের অবস্থা:\n\n" +
      "✅ Telegram: এই bot-এর মাধ্যমে সংযুক্ত।\n" +
      "⏳ WhatsApp: এখনো সংযুক্ত নয়।\n" +
      "⏳ Facebook Messenger: এখনো সংযুক্ত নয়।\n" +
      "🔒 Gmail, গেম ও ফোনের অন্য অ্যাপ: কোনো প্রবেশাধিকার নেই।\n\n" +
      "আমি শুধু Telegram-এ পাওয়া মেসেজের উত্তর দিতে পারি।"
    );
    return;
  }

  if (incoming.startsWith("/")) return;

  try {
    const history = recent.get(chatId) || [];
    const contents = [
      ...history,
      { role: "user", parts: [{ text: incoming }] }
    ];

    const result = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents,
      config: { systemInstruction: SYSTEM_INSTRUCTION }
    });

    const answer = result.text?.trim() || "দুঃখিত, এবার উত্তর তৈরি করতে পারলাম না। আবার চেষ্টা করবে?";
    const updated = [
      ...contents,
      { role: "model", parts: [{ text: answer }] }
    ].slice(-MAX_HISTORY_MESSAGES);
    recent.set(chatId, updated);
    await reply(msg.chat.id, answer);
  } catch (error) {
    console.error("Message processing failed:", error?.message || error);
    await reply(msg.chat.id, "দুঃখিত, এই মুহূর্তে উত্তর তৈরি করতে সমস্যা হচ্ছে। একটু পরে আবার চেষ্টা করো।");
  }
});

app.listen(PORT, () => console.log(`J\`Neferu listening on ${PORT}`));
