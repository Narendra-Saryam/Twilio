require("dotenv").config();
const twilio = require("twilio")(process.env.TWILIO_SID, process.env.TWILIO_AUTH);
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);

async function getWordFromGemini() {
  const prompt = `
Give me one uncommon or difficult English word with:
- definition
- example sentence
- 3-5 synonyms
- 3-5 antonyms
Return strictly in JSON:
{
  "word": "...",
  "definition": "...",
  "example": "...",
  "synonyms": ["..."],
  "antonyms": ["..."]
}
`;

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const result = await model.generateContent(prompt);

  try {
    return JSON.parse(result.response.text());
  } catch (err) {
    throw new Error("Gemini did not return valid JSON");
  }
}

async function sendWhatsApp(body) {
  await twilio.messages.create({
    from: process.env.TWILIO_FROM,
    to: process.env.TWILIO_TO,
    body
  });
}

async function main() {
  const d = await getWordFromGemini();

  let msg = `*Word of the Day*: ${d.word}\n\n*Definition*: ${d.definition}\n`;
  if (d.example) msg += `\n*Example*: ${d.example}\n`;
  if (d.synonyms?.length) msg += `\n*Synonyms*: ${d.synonyms.join(", ")}\n`;
  if (d.antonyms?.length) msg += `\n*Antonyms*: ${d.antonyms.join(", ")}\n`;

  await sendWhatsApp(msg);
}

main().catch(console.error);
