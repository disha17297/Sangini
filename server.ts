import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import compression from "compression";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

import {
  sanitizeInput,
  validateImagePayload,
  securityHeadersMiddleware,
  ScamCheckSchema,
  DocumentSimplifySchema,
  MedInfoSchema,
  CompanionChatSchema,
} from "./server/security.js";
import { aiRateLimiter, apiRateLimiter } from "./server/rateLimiter.js";
import { scamCache, docCache, medCache } from "./server/cache.js";
import { errorHandler } from "./server/errorHandler.js";
import {
  callGeminiWithResilience,
  generateScamFallback,
  generateDocumentFallback,
  generateMedicineFallback,
  generateCompanionChatFallback,
} from "./server/geminiService.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Security & Performance Middlewares
app.use(securityHeadersMiddleware);
app.use(compression());
app.use(express.json({ limit: "8mb" }));

// Lazy Gemini client initialization
let genAI: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      genAI = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
  }
  return genAI;
}

// Health check with rate limiting and system status
app.get("/api/health", apiRateLimiter.getMiddleware(), (_req, res) => {
  res.json({
    status: "ok",
    aiConfigured: Boolean(process.env.GEMINI_API_KEY),
    cacheStats: {
      scam: scamCache.getStats(),
      doc: docCache.getStats(),
      med: medCache.getStats(),
    },
    version: "2.1.0",
    uptime: Math.floor(process.uptime()),
  });
});

// 1. Scam & Fraud Checker Endpoint (Protected with Rate Limiter & Cache)
app.post("/api/gemini/scam-check", aiRateLimiter.getMiddleware(), async (req, res, next) => {
  try {
    const validated = ScamCheckSchema.parse(req.body);
    const content = sanitizeInput(validated.content, 5000);
    const isHindi = validated.language === "hi";

    // Validate optional image payload
    const imageCheck = validateImagePayload(validated.imageBase64, validated.mimeType);
    if (!imageCheck.valid) {
      res.status(400).json({ error: imageCheck.error, code: "INVALID_IMAGE" });
      return;
    }

    // Check in-memory cache for repeated text checks
    const cacheKey = scamCache.generateKey("scam", {
      content,
      lang: validated.language,
      hasImage: Boolean(validated.imageBase64),
    });

    const cachedResult = scamCache.get(cacheKey);
    if (cachedResult) {
      res.setHeader("X-Cache-Status", "HIT");
      res.json(cachedResult);
      return;
    }

    const ai = getGenAI();

    const systemInstruction = `You are a deeply caring, protective, and respectful digital safety guardian for senior citizens and grandparents.
Your goal is to inspect suspicious text messages, WhatsApp forwards, emails, lottery claims, electricity disconnection threats, KYC expiry notices, and screenshots.
Analyze if it is a SCAM or SAFE.
The user prefers language: ${isHindi ? "Hindi (written in simple Devanagari Hindi with respectful words)" : "Simple, plain English with zero tech jargon"}.
Return STRICT JSON matching this schema:
{
  "verdict": "safe" | "warning" | "dangerous_scam",
  "score": number between 0 and 100 (where 0 is completely safe, 100 is definite scam),
  "title": "short clear heading",
  "explanation": "2-3 short, clear sentences explaining exactly why this is safe or dangerous",
  "redFlags": ["specific red flag 1", "specific red flag 2"],
  "safeActions": ["exact step 1 to take", "exact step 2 to take"],
  "reassurance": "warm praise reminding them they did the right thing by asking"
}`;

    const parts: any[] = [];
    if (imageCheck.cleanBase64 && validated.mimeType) {
      parts.push({
        inlineData: {
          mimeType: validated.mimeType,
          data: imageCheck.cleanBase64,
        },
      });
    }
    parts.push({
      text: `Analyze this message/document for an elderly person:
"""${content || "Please examine the provided image for scam indicators"}"""`,
    });

    const result = await callGeminiWithResilience({
      ai,
      contents: { parts },
      systemInstruction,
      fallbackGenerator: () => generateScamFallback(content, isHindi),
      preferredModels: ["gemini-3.8-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"],
    });

    scamCache.set(cacheKey, result.data, 2 * 60 * 60 * 1000);
    res.setHeader("X-Cache-Status", result.isFallback ? "FALLBACK" : "MISS");
    res.json(result.data);
  } catch (error: any) {
    next(error);
  }
});

// 2. Document & Bill Simplifier Endpoint (Protected with Rate Limiter & Cache)
app.post("/api/gemini/simplify-document", aiRateLimiter.getMiddleware(), async (req, res, next) => {
  try {
    const validated = DocumentSimplifySchema.parse(req.body);
    const content = sanitizeInput(validated.content, 10000);
    const isHindi = validated.language === "hi";

    const imageCheck = validateImagePayload(validated.imageBase64, validated.mimeType);
    if (!imageCheck.valid) {
      res.status(400).json({ error: imageCheck.error, code: "INVALID_IMAGE" });
      return;
    }

    const cacheKey = docCache.generateKey("doc", {
      content,
      docType: validated.docType,
      lang: validated.language,
      hasImage: Boolean(validated.imageBase64),
    });

    const cached = docCache.get(cacheKey);
    if (cached) {
      res.setHeader("X-Cache-Status", "HIT");
      res.json(cached);
      return;
    }

    const ai = getGenAI();

    const systemInstruction = `You are a patient, helpful assistant that simplifies complex, confusing bills, letters, pension slips, and medical discharge summaries for senior citizens.
Break down the document into simple, reassuring, crystal-clear information.
The user speaks ${isHindi ? "Hindi (in simple, respectful Devanagari Hindi)" : "Plain, crystal-clear English with no fine-print jargon"}.
Return STRICT JSON format:
{
  "summary": "1 sentence warm overview",
  "whatIsThis": "exact type of document (e.g., Electricity Bill, Hospital Discharge Slip, Pension Advice)",
  "amountToPay": "amount if applicable, or 'No payment needed'",
  "dueDate": "clear date if applicable, or 'No deadline'",
  "keyPoints": ["plain point 1", "plain point 2", "plain point 3"],
  "actionSteps": ["Step 1 in simple terms", "Step 2 in simple terms"],
  "easyExplanation": "A friendly 2-sentence explanation of what this means in everyday life"
}`;

    const parts: any[] = [];
    if (imageCheck.cleanBase64 && validated.mimeType) {
      parts.push({
        inlineData: {
          mimeType: validated.mimeType,
          data: imageCheck.cleanBase64,
        },
      });
    }
    parts.push({
      text: `Document text or details for document type "${validated.docType}":\n"""${content || "Analyze the attached document/bill image"}"""`,
    });

    const result = await callGeminiWithResilience({
      ai,
      contents: { parts },
      systemInstruction,
      fallbackGenerator: () =>
        generateDocumentFallback(content, validated.docType || "bill", isHindi),
      preferredModels: ["gemini-3.8-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"],
    });

    docCache.set(cacheKey, result.data, 2 * 60 * 60 * 1000);
    res.setHeader("X-Cache-Status", result.isFallback ? "FALLBACK" : "MISS");
    res.json(result.data);
  } catch (error: any) {
    next(error);
  }
});

// 3. Medicine & Prescription Explainer Endpoint (Protected with Rate Limiter & Cache)
app.post("/api/gemini/med-info", aiRateLimiter.getMiddleware(), async (req, res, next) => {
  try {
    const validated = MedInfoSchema.parse(req.body);
    const medicineName = sanitizeInput(validated.medicineName, 150);
    const instructions = sanitizeInput(validated.instructions, 1000);
    const isHindi = validated.language === "hi";

    const cacheKey = medCache.generateKey("med", {
      name: medicineName.toLowerCase(),
      instructions,
      lang: validated.language,
    });

    const cached = medCache.get(cacheKey);
    if (cached) {
      res.setHeader("X-Cache-Status", "HIT");
      res.json(cached);
      return;
    }

    const ai = getGenAI();

    const systemInstruction = `You are a compassionate, careful medical information simplifier for senior citizens.
Explain what a medicine is generally for, how to remember taking it, and common practical habits (e.g. take with water, with food).
Always include a warm, responsible disclaimer that this is educational guidance and they should follow their doctor's exact prescription.
User language: ${isHindi ? "Hindi (Devanagari, simple and caring)" : "English (simple, warm, easy to read)"}.
Return STRICT JSON:
{
  "name": "name of medicine",
  "purpose": "clear explanation of what it does in 1-2 gentle sentences",
  "whenToTake": "practical advice on when and how to take it safely",
  "importantCautions": ["caution 1", "caution 2", "caution 3"],
  "friendlyTip": "encouraging senior-friendly tip"
}`;

    const result = await callGeminiWithResilience({
      ai,
      contents: `Medicine name: ${medicineName}. Extra instructions/notes: ${instructions || "None"}. Explain for a senior citizen.`,
      systemInstruction,
      fallbackGenerator: () =>
        generateMedicineFallback(medicineName, instructions, isHindi),
      preferredModels: ["gemini-3.8-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"],
    });

    medCache.set(cacheKey, result.data, 24 * 60 * 60 * 1000);
    res.setHeader("X-Cache-Status", result.isFallback ? "FALLBACK" : "MISS");
    res.json(result.data);
  } catch (error: any) {
    next(error);
  }
});

// 4. Caring Companion Chat & Proactive Assistant (Protected with Rate Limiter)
app.post("/api/gemini/companion-chat", aiRateLimiter.getMiddleware(), async (req, res, next) => {
  try {
    const validated = CompanionChatSchema.parse(req.body);
    const isHindi = validated.language === "hi";

    const ai = getGenAI();

    const systemInstruction = `You are "Sangini" (संगिनी), an affectionate, exceptionally patient, and intelligent AI daily companion created specifically for senior citizens and grandparents.
Persona Guidelines:
1. Tone: Respectful, warm, reassuring, loving like a caring family member or devoted grandson/granddaughter.
2. Form of address in Hindi: Use "आप", "जी", "नमस्ते जी", "प्रणाम", "आपकी सेहत कैसी है?", "बिल्कुल चिंता मत कीजिए".
3. Form of address in English: Use warm, gentle words, e.g., "Hello! I am right here with you", "Take your time", "You are doing wonderful".
4. Brevity: Keep responses concise (3-4 short sentences maximum). Seniors easily get overwhelmed by walls of text.
5. Content: Assist with everyday tasks—reading bank messages, understanding digital bills, booking doctor slots, managing tablets, overcoming digital anxiety, or just having a warm conversation if they feel lonely.
6. Language: Respond in ${isHindi ? "pure, natural Hindi (Devanagari script)" : "warm, plain English"}.
7. Return STRICT JSON format:
{
  "reply": "The warm, helpful conversational message",
  "suggestedActions": ["Short 2-4 word prompt 1", "Short prompt 2", "Short prompt 3"]
}`;

    const formattedContents = validated.messages.map((m) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: sanitizeInput(m.content, 2000) }],
    }));

    if (validated.userProfile?.name) {
      formattedContents.unshift({
        role: "user",
        parts: [
          {
            text: `[Context: The senior's name is ${sanitizeInput(validated.userProfile.name, 100)}, preferred language is ${validated.language}]`,
          },
        ],
      });
    }

    const result = await callGeminiWithResilience({
      ai,
      contents: formattedContents,
      systemInstruction,
      fallbackGenerator: () =>
        generateCompanionChatFallback(validated.messages, isHindi),
      preferredModels: ["gemini-3.8-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"],
    });

    res.json(result.data);
  } catch (error: any) {
    next(error);
  }
});

// Centralized Error Handler Middleware
app.use(errorHandler);

// Vite middleware / Static Serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Sangini Senior Companion server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
