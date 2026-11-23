import express from "express";
import { GoogleGenAI } from "@google/genai";

const app = express();
app.use(express.json());

const {
  TELEGRAM_BOT_TOKEN,
  TELEGRAM_WEBHOOK_SECRET,
  GEMINI_API_KEY,
  GEMINI_MODEL = "gemini-2.5-flash",
  PORT = 3000
} = process.env;

if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_WEBHOOK_SECRET || !GEMINI_API_KEY) {
  console.error("Missing TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET, or GEMINI_API_KEY");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
const recent = new Map();

app.get("/", (_req, res) => res.send("J`Neferu is online."));
app.get("/health", (_req, res) => res.json({ ok: true, assistant: "J`Neferu" }));

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
  // Telegram message limit is 4096 characters.
  const chunks = text.match(/[\s\S]{1,3900}/g) || ["আমি এখন উত্তর দিতে পারছি না।"];
  for (const chunk of chunks) {
    await telegram("sendMessage", { chat_id: chatId, text: chunk });
  }
}

app.post("/telegram/webhook", async (req, res) => {
  if (req.get("x-telegram-bot-api-secret-token") !== TELEGRAM_WEBHOOK_SECRET) {
    return res.sendStatus(401);
  }

  // Acknowledge quickly; process message after responding to Telegram.
  res.sendStatus(200);
  const msg = req.body?.message;
  if (!msg?.chat?.id || !msg?.text) return;
  if (msg.text.startsWith("/start")) {
    await reply(msg.chat.id, "হ্যালো! আমি J`Neferu। 😊 তোমার সঙ্গে কথা বলতে প্রস্তুত।");
    return;
  }
  if (msg.text.startsWith("/")) return;

  try {
    const chatId = String(msg.chat.id);
    const history = recent.get(chatId) || [];
    const contents = [
      ...history,
      { role: "user", parts: [{ text: msg.text }] }
    ];

    const result = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents,
      config: {
        systemInstruction:
          "তোমার নাম J`Neferu। তুমি বন্ধুসুলভ, স্বাভাবিক ও সহায়ক ব্যক্তিগত AI সহকারী। " +
          "ব্যবহারকারীর ভাষায় উত্তর দাও। কোনো টাকা পাঠানো, কেনাকাটা, অ্যাকাউন্ট পরিবর্তন, " +
          "OTP/পাসওয়ার্ড প্রকাশ, বা অন্য বাহ্যিক কাজ নিজে থেকে করো না। এসবের জন্য মালিকের স্পষ্ট অনুমতি দরকার। " +
          "তুমি কোনো কাজ সম্পন্ন হয়েছে বলে দাবি করবে না, যদি সত্যিই তা না করে থাকো।"
      }
    });

    const answer = result.text || "দুঃখিত, এবার উত্তর তৈরি করতে পারলাম না।";
    const updated = [
      ...contents,
      { role: "model", parts: [{ text: answer }] }
    ].slice(-12);
    recent.set(chatId, updated);
    await reply(msg.chat.id, answer);
  } catch (error) {
    console.error("Message processing failed:", error);
    await reply(msg.chat.id, "দুঃখিত, সাময়িক সমস্যা হয়েছে। একটু পরে আবার চেষ্টা করো।");
  }
});

app.listen(PORT, () => console.log(`J\`Neferu listening on ${PORT}`));
