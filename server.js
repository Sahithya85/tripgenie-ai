// TripGenie AI - backend. The Gemini API key lives ONLY here (read from .env).
import "dotenv/config";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GoogleGenAI } from "@google/genai";
import { validate, buildPrompt, parseJSON, isValidPlan, friendlyError } from "./lib.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const API_KEY = process.env.GEMINI_API_KEY;
const PORT = process.env.PORT || 3000;

// Primary model first. If Google says it is unavailable (404) or its free quota is used up (429),
// the server automatically tries the fallback model.
const PRIMARY = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";
const FALLBACK = process.env.GEMINI_FALLBACK_MODEL || "gemini-3.1-flash-lite";
const MODELS = [...new Set([PRIMARY, FALLBACK])];

if (!API_KEY || API_KEY.includes("your-gemini-api-key")) {
  console.error("\nMissing GEMINI_API_KEY.\nCopy .env.example to .env, paste your Gemini API key, then run npm start again.\n");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: API_KEY, httpOptions: { timeout: 90000 } });

const app = express();
app.use(express.json({ limit: "10kb" }));
app.use(express.static(path.join(__dirname, "public")));

// Tiny in-memory rate limiter: 6 requests / minute / IP (protects your free quota).
const hits = new Map();
function rateLimit(req, res, next) {
  const now = Date.now();
  const arr = (hits.get(req.ip) || []).filter((t) => now - t < 60000);
  if (arr.length >= 6) return res.status(429).json({ error: "Too many requests. Please wait a minute." });
  arr.push(now);
  hits.set(req.ip, arr);
  next();
}

// Safe health check (never returns the key).
app.get("/api/health", (req, res) => res.json({ ok: true, models: MODELS }));

async function callGemini(model, prompt) {
  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: { responseMimeType: "application/json", temperature: 0.7, maxOutputTokens: 8192 },
  });
  let data;
  try { data = parseJSON(response.text); } catch { data = null; }
  return data;
}

app.post("/api/plan", rateLimit, async (req, res) => {
  const { v, error } = validate(req.body || {});
  if (error) return res.status(400).json({ error });
  const prompt = buildPrompt(v);

  let lastErr;
  for (let i = 0; i < MODELS.length; i++) {
    const model = MODELS[i];
    try {
      const data = await callGemini(model, prompt);
      if (!isValidPlan(data))
        return res.status(502).json({ error: "The AI returned an unexpected format. Please click Generate again." });
      console.log(`Itinerary generated with ${model}`);
      return res.json({ data });
    } catch (e) {
      lastErr = e;
      const status = Number(e?.status ?? e?.code) || 0;
      const msg = String(e?.message || "");
      console.error(`Gemini error with ${model} (status ${status || "n/a"}):`, msg.slice(0, 200));
      const canFallBack = status === 404 || status === 429 || /not found|no longer available|RESOURCE_EXHAUSTED/i.test(msg);
      if (canFallBack && i < MODELS.length - 1) { console.log(`Trying fallback model ${MODELS[i + 1]}...`); continue; }
      break;
    }
  }
  const { status, message } = friendlyError(lastErr);
  res.status(status).json({ error: message });
});

app.listen(PORT, () => console.log(`TripGenie AI [Gemini edition] running at http://localhost:${PORT}  (models: ${MODELS.join(" -> ")})`));
