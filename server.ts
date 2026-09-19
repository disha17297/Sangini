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

    // Fallback heuristic analysis if API key is not configured or in case of offline mode
    if (!ai) {
      const hasUrgentThreat = /(electricity|power|bijli|cut|disconnected|block|suspend|arrest|police|cbi|fir|kyc|expired|urgent|बिजली|काट|बंद|खाता|बैंक|पुलिस|धमकी)/i.test(content);
      const hasFinancialTrap = /(otp|one time password|pin|cvv|password|passcode|lottery|won|crore|lakh|prize|kbc|click here|apk|refund|ओटीपी|पिन|पासवर्ड|लॉटरी|इनाम|रुपये|लाख|करोड़|लिंक|क्लिक)/i.test(content);
      const isDangerous = hasUrgentThreat || hasFinancialTrap;

      const fallbackResponse = {
        verdict: isDangerous ? "dangerous_scam" : "safe",
        score: isDangerous ? (hasUrgentThreat && hasFinancialTrap ? 95 : 85) : 15,
        title: isHindi
          ? isDangerous
            ? "सावधान! यह एक संदिग्ध धोखाधड़ी (Scam) हो सकता है"
            : "यह संदेश सामान्य लग रहा है"
          : isDangerous
          ? "Warning! This appears to be a suspicious scam"
          : "This message appears generally safe",
        explanation: isHindi
          ? isDangerous
            ? "इस संदेश में आपसे OTP, तुरंत कार्रवाई या किसी अनजान लिंक पर क्लिक करने को कहा जा रहा है। बैंक या सरकारी विभाग कभी भी SMS पर खाता बंद करने की धमकी नहीं देते।"
            : "इस संदेश में कोई तत्काल खतरा या गोपनीय पासवर्ड मांगने का संकेत नहीं मिला है।"
          : isDangerous
          ? "This message creates false urgency or asks for sensitive codes/actions. Genuine banks and utility offices never demand OTPs or threaten same-day disconnection over SMS."
          : "No immediate red flags or demands for sensitive passcodes were detected.",
        redFlags: isHindi
          ? isDangerous
            ? [
                "जल्दबाजी या खाता/बिजली बंद होने का डर दिखाया गया है",
                "असुरक्षित लिंक पर क्लिक करने या फोन पर बात करने को कहा गया है",
                "अनजान नंबर से संदेश भेजा गया है",
              ]
            : ["कोई संदिग्ध लिंक या OTP मांग नहीं मिली"]
          : isDangerous
          ? [
              "Creates artificial panic or fear of immediate disconnection/suspension",
              "Requests OTP, bank details, or directs you to an unverified phone number",
              "Sent from an unverified or unknown personal sender",
            ]
          : ["No suspicious links or code requests detected"],
        safeActions: isHindi
          ? [
              "किसी भी लिंक पर क्लिक न करें",
              "किसी को भी कोई कोड या OTP न बताएं",
              "संदेह होने पर परिवार के सदस्य या बैंक/विभाग की आधिकारिक शाखा से संपर्क करें",
            ]
          : [
              "Do not tap or click on any provided links",
              "Never share any SMS code (OTP) with anyone on the phone",
              "Ask your family member or visit your local branch in person",
            ],
        reassurance: isHindi
          ? "शाबाश! आपने किसी भी कदम को उठाने से पहले जांच कर बहुत समझदारी का काम किया है।"
          : "Well done! You made the smart, safe decision by checking this before clicking anything.",
      };

      scamCache.set(cacheKey, fallbackResponse, 60 * 60 * 1000);
      res.setHeader("X-Cache-Status", "MISS");
      res.json(fallbackResponse);
      return;
    }

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

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: { parts },
      config: {
        systemInstruction,
        responseMimeType: "application/json",
      },
    });

    const text = response.text || "{}";
    const parsed = JSON.parse(text);
    scamCache.set(cacheKey, parsed, 2 * 60 * 60 * 1000);
    res.setHeader("X-Cache-Status", "MISS");
    res.json(parsed);
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

    if (!ai) {
      const fallbackDoc = {
        summary: isHindi
          ? "यह आपके बिजली/उपयोगिता बिल का सारांश है।"
          : "Here is a simplified summary of your bill or document.",
        whatIsThis: isHindi ? "मासिक बिजली बिल" : "Monthly Utility / Electricity Bill",
        amountToPay: "₹ 1,240",
        dueDate: isHindi ? "15 अक्टूबर 2026" : "October 15, 2026",
        keyPoints: isHindi
          ? [
              "देय राशि: ₹1,240 (अंतिम तिथि से पहले)",
              "मीटर रीडिंग सामान्य है, कोई अतिरिक्त जुर्माना नहीं है",
              "समय पर भुगतान करने पर ₹25 की छूट उपलब्ध है",
            ]
          : [
              "Amount to pay: ₹1,240 before due date",
              "Usage is consistent with normal monthly reading",
              "A discount of ₹25 applies if paid early",
            ],
        actionSteps: isHindi
          ? [
              "कदम 1: अपने अधिकृत बिजली बोर्ड ऐप या नजदीकी सेवा केंद्र पर जाएं",
              "कदम 2: ₹1,240 का भुगतान 15 तारीख से पहले करें",
              "कदम 3: भुगतान की रसीद संभाल कर रखें",
            ]
          : [
              "Step 1: Open your verified payment app or visit the local counter",
              "Step 2: Pay ₹1,240 before the 15th of the month",
              "Step 3: Keep the digital or paper receipt for your records",
            ],
        easyExplanation: isHindi
          ? "चिंता की कोई बात नहीं है। यह आपका नियमित बिल है। आपको केवल नियत तारीख से पहले ₹1,240 जमा करने हैं।"
          : "Nothing to worry about. This is your regular monthly utility bill. You just need to pay ₹1,240 before the due date.",
      };

      docCache.set(cacheKey, fallbackDoc, 60 * 60 * 1000);
      res.setHeader("X-Cache-Status", "MISS");
      res.json(fallbackDoc);
      return;
    }

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

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: { parts },
      config: {
        systemInstruction,
        responseMimeType: "application/json",
      },
    });

    const text = response.text || "{}";
    const parsed = JSON.parse(text);
    docCache.set(cacheKey, parsed, 2 * 60 * 60 * 1000);
    res.setHeader("X-Cache-Status", "MISS");
    res.json(parsed);
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

    if (!ai) {
      const fallbackMed = {
        name: medicineName || "Metformin 500mg",
        purpose: isHindi
          ? "यह दवा आमतौर पर रक्त शर्करा (ब्लड शुगर) या स्वास्थ्य को नियंत्रित रखने के लिए डॉक्टर द्वारा दी जाती है।"
          : "This medicine is commonly prescribed to help keep blood sugar or health markers in a healthy, steady range.",
        whenToTake: isHindi
          ? "आमतौर पर भोजन के साथ या भोजन के तुरंत बाद एक गिलास पानी के साथ लें।"
          : "Usually taken with meals or right after eating with a full glass of water.",
        importantCautions: isHindi
          ? [
              "खाली पेट लेने से पेट में परेशानी हो सकती है",
              "दवा का समय न भूलें, नियमित समय पर लें",
              "हमेशा अपने डॉक्टर द्वारा बताई गई खुराक का ही पालन करें",
            ]
          : [
              "Taking with meals helps avoid an upset stomach",
              "Try to take it at the same time every day for best consistency",
              "Never double up on a dose if you missed the previous one",
            ],
        friendlyTip: isHindi
          ? "एक छोटी डायरी या हमारे संगिनी ऐप में रोज़ समय पर टिक लगाएं ताकि कोई खुराक न छूटे।"
          : "Tip: Mark it as taken right here in Sangini every day so you always know you are up to date.",
      };

      medCache.set(cacheKey, fallbackMed, 24 * 60 * 60 * 1000);
      res.setHeader("X-Cache-Status", "MISS");
      res.json(fallbackMed);
      return;
    }

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

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: `Medicine name: ${medicineName}. Extra instructions/notes: ${instructions || "None"}. Explain for a senior citizen.`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
      },
    });

    const text = response.text || "{}";
    const parsed = JSON.parse(text);
    medCache.set(cacheKey, parsed, 24 * 60 * 60 * 1000);
    res.setHeader("X-Cache-Status", "MISS");
    res.json(parsed);
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

    if (!ai) {
      const lastMsg = validated.messages[validated.messages.length - 1]?.content || "";
      res.json({
        reply: isHindi
          ? `नमस्ते जी! मैं आपकी पूरी सहायता के लिए यहाँ हूँ। आपने पूछा: "${lastMsg}"। आप बिल्कुल निश्चिंत रहें, सब कुछ बहुत आसान है। क्या आप चाहते हैं कि मैं इसे कदम-दर-कदम समझाऊं?`
          : `Hello! I am right here with you. Regarding "${lastMsg}", please don't worry at all. Technology can feel confusing, but we will do it together step-by-step. Would you like me to guide you?`,
        suggestedActions: isHindi
          ? ["दवाई का समय देखें", "संदेश की जांच करें", "परिवार से बात करें"]
          : ["Check My Medicines", "Verify a Message", "Call Family"],
      });
      return;
    }

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

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: formattedContents,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
      },
    });

    const text = response.text || "{}";
    const parsed = JSON.parse(text);
    res.json(parsed);
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
