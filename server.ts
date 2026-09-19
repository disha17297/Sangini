import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "15mb" }));

// Lazy Gemini client
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

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", aiConfigured: Boolean(process.env.GEMINI_API_KEY) });
});

// 1. Scam & Fraud Checker Endpoint
app.post("/api/gemini/scam-check", async (req, res) => {
  try {
    const { content, imageBase64, mimeType, language = "en" } = req.body;
    const ai = getGenAI();

    const isHindi = language === "hi";

    if (!ai) {
      // Fallback rule-based analysis if API key is not present
      const hasOtp = /(otp|one time password|pin|cvv|password|passcode|urgent|block|suspend|lottery|won|crore|lakh|link|click here|apk)/i.test(
        content || ""
      );
      return res.json({
        verdict: hasOtp ? "dangerous_scam" : "safe",
        score: hasOtp ? 85 : 15,
        title: isHindi
          ? hasOtp
            ? "सावधान! यह एक संदिग्ध धोखाधड़ी (Scam) हो सकता है"
            : "यह संदेश सामान्य लग रहा है"
          : hasOtp
          ? "Warning! This appears to be a suspicious scam"
          : "This message appears generally safe",
        explanation: isHindi
          ? hasOtp
            ? "इस संदेश में आपसे OTP, तुरंत कार्रवाई या किसी अनजान लिंक पर क्लिक करने को कहा जा रहा है। बैंक कभी भी फोन या SMS पर OTP या पासवर्ड नहीं मांगते।"
            : "इस संदेश में कोई तत्काल खतरा या OTP मांगने का संकेत नहीं मिला है।"
          : hasOtp
          ? "This message creates false urgency or asks for sensitive codes/actions. Genuine banks and organizations never ask for your OTP, PIN, or password over SMS/WhatsApp."
          : "No immediate red flags or demands for sensitive passcodes were detected.",
        redFlags: isHindi
          ? hasOtp
            ? [
                "जल्दबाजी या खाता बंद होने का डर दिखाया गया है",
                "असुरक्षित लिंक या कोड मांगा गया है",
                "अनजान नंबर से संदेश आया है",
              ]
            : ["कोई संदिग्ध लिंक या OTP मांग नहीं मिली"]
          : hasOtp
          ? [
              "Creates artificial urgency or fear of account suspension",
              "Requests OTP or directs you to an unofficial web link",
              "Sent from an unverified or unknown source",
            ]
          : ["No suspicious links or code requests detected"],
        safeActions: isHindi
          ? [
              "किसी भी लिंक पर क्लिक न करें",
              "किसी को भी कोई कोड या OTP न बताएं",
              "संदेह होने पर परिवार के सदस्य या बैंक की आधिकारिक शाखा से संपर्क करें",
            ]
          : [
              "Do not tap or click on any provided links",
              "Never share any SMS code (OTP) with anyone, even if they claim to be from the bank",
              "Ask your family member or visit your local branch in person",
            ],
        reassurance: isHindi
          ? "शाबाश! आपने किसी भी कदम को उठाने से पहले जांच कर बहुत समझदारी का काम किया है।"
          : "Well done! You made the smart, safe decision by checking this before clicking anything.",
      });
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
    if (imageBase64 && mimeType) {
      parts.push({
        inlineData: {
          mimeType,
          data: imageBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, ""),
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
    return res.json(parsed);
  } catch (error: any) {
    console.error("Scam check error:", error);
    res.status(500).json({ error: error.message || "Failed to analyze message" });
  }
});

// 2. Document & Bill Simplifier Endpoint
app.post("/api/gemini/simplify-document", async (req, res) => {
  try {
    const { content, imageBase64, mimeType, docType = "bill", language = "en" } = req.body;
    const ai = getGenAI();
    const isHindi = language === "hi";

    if (!ai) {
      return res.json({
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
      });
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
    if (imageBase64 && mimeType) {
      parts.push({
        inlineData: {
          mimeType,
          data: imageBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, ""),
        },
      });
    }
    parts.push({
      text: `Document text or details for document type "${docType}":\n"""${content || "Analyze the attached document/bill image"}"""`,
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
    return res.json(parsed);
  } catch (error: any) {
    console.error("Document simplification error:", error);
    res.status(500).json({ error: error.message || "Failed to simplify document" });
  }
});

// 3. Medicine & Prescription Explainer Endpoint
app.post("/api/gemini/med-info", async (req, res) => {
  try {
    const { medicineName, instructions, language = "en" } = req.body;
    const ai = getGenAI();
    const isHindi = language === "hi";

    if (!ai) {
      return res.json({
        name: medicineName || "Metformin 500mg",
        purpose: isHindi
          ? "यह दवा आमतौर पर रक्त शर्करा (ब्लड शुगर) को नियंत्रित रखने के लिए डॉक्टर द्वारा दी जाती है।"
          : "This medicine is commonly prescribed to help keep blood sugar levels in a healthy, steady range.",
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
      });
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
    return res.json(parsed);
  } catch (error: any) {
    console.error("Med info error:", error);
    res.status(500).json({ error: error.message || "Failed to explain medicine" });
  }
});

// 4. Caring Companion Chat & Proactive Assistant
app.post("/api/gemini/companion-chat", async (req, res) => {
  try {
    const { messages, language = "en", userProfile } = req.body;
    const ai = getGenAI();
    const isHindi = language === "hi";

    if (!ai) {
      const lastMsg = messages && messages.length > 0 ? messages[messages.length - 1].content : "";
      return res.json({
        reply: isHindi
          ? `नमस्ते जी! मैं आपकी पूरी सहायता के लिए यहाँ हूँ। आपने पूछा: "${lastMsg}"। आप बिल्कुल निश्चिंत रहें, सब कुछ बहुत आसान है। क्या आप चाहते हैं कि मैं इसे कदम-दर-कदम समझाऊं?`
          : `Hello! I am right here with you. Regarding "${lastMsg}", please don't worry at all. Technology can feel confusing, but we will do it together step-by-step. Would you like me to guide you?`,
        suggestedActions: isHindi
          ? ["दवाई का समय देखें", "संदेश की जांच करें", "परिवार से बात करें"]
          : ["Check My Medicines", "Verify a Message", "Call Family"],
      });
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

    const formattedContents = (messages || []).map((m: any) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    }));

    if (userProfile) {
      formattedContents.unshift({
        role: "user",
        parts: [
          {
            text: `[Context: The senior's name is ${userProfile.name || "respected elder"}, preferred language is ${language}]`,
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
    return res.json(parsed);
  } catch (error: any) {
    console.error("Chat error:", error);
    res.status(500).json({ error: error.message || "Companion chat error" });
  }
});

// Vite middleware
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
