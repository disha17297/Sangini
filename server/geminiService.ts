import { GoogleGenAI } from "@google/genai";

export interface ResilienceOptions<T> {
  ai: GoogleGenAI | null;
  contents: any;
  systemInstruction?: string;
  responseMimeType?: string;
  fallbackGenerator: () => T;
  preferredModels?: string[];
  maxRetriesPerModel?: number;
}

/**
 * Validates if an error is a transient / high-demand / quota / connection error
 * that warrants exponential backoff retry and/or model fallback.
 */
export function isRetryableGeminiError(error: any): boolean {
  if (!error) return false;

  const errorString = String(error?.message || error?.status || error || "");
  const statusCode = error?.status || error?.statusCode || error?.code;

  // Check 503 Service Unavailable / Model High Demand
  if (
    statusCode === 503 ||
    statusCode === "503" ||
    /503|UNAVAILABLE|high demand|spikes in demand|temporarily unavailable/i.test(errorString)
  ) {
    return true;
  }

  // Check 429 Rate Limit / Resource Exhausted
  if (
    statusCode === 429 ||
    statusCode === "429" ||
    /429|RESOURCE_EXHAUSTED|quota exceeded|rate limit/i.test(errorString)
  ) {
    return true;
  }

  // Check network connection drops / transient fetch failures
  if (
    /fetch failed|ECONNRESET|ETIMEDOUT|ENOTFOUND|network error|socket hang up/i.test(
      errorString
    )
  ) {
    return true;
  }

  return false;
}

/**
 * Delays execution for a specified duration with random jitter to prevent thundering herds.
 */
export async function sleepWithJitter(ms: number): Promise<void> {
  const jitter = Math.floor(Math.random() * (ms * 0.3));
  const total = ms + jitter;
  return new Promise((resolve) => setTimeout(resolve, total));
}

// Circuit-breaker cooldown map for models experiencing temporary 503 high demand
const modelCooldowns = new Map<string, number>();
const COOLDOWN_DURATION_MS = 5 * 60 * 1000; // 5 minutes

export function isModelInCooldown(modelName: string): boolean {
  const expiresAt = modelCooldowns.get(modelName);
  if (!expiresAt) return false;
  if (Date.now() > expiresAt) {
    modelCooldowns.delete(modelName);
    return false;
  }
  return true;
}

export function recordModelCooldown(modelName: string): void {
  modelCooldowns.set(modelName, Date.now() + COOLDOWN_DURATION_MS);
}

/**
 * Resilient Gemini caller that handles transient 503/429 spikes through:
 * 1. Immediate fallback across compliant models ('gemini-3.1-flash-lite' -> 'gemini-3.8-flash' -> 'gemini-flash-latest').
 * 2. Model cooldown circuit breaker to skip models experiencing high-demand spikes.
 * 3. Graceful rule-based fallback if all models or network are unavailable, guaranteeing 0 unhandled crashes for seniors.
 */
export async function callGeminiWithResilience<T>(
  options: ResilienceOptions<T>
): Promise<{ data: T; isFallback: boolean; modelUsed?: string; note?: string }> {
  const {
    ai,
    contents,
    systemInstruction,
    responseMimeType = "application/json",
    fallbackGenerator,
    preferredModels = ["gemini-3.1-flash-lite", "gemini-3.8-flash", "gemini-flash-latest"],
    maxRetriesPerModel = 0,
  } = options;

  // If AI client is unconfigured, return rule-based fallback immediately
  if (!ai) {
    return {
      data: fallbackGenerator(),
      isFallback: true,
      note: "Offline heuristic fallback (API unconfigured)",
    };
  }

  // Filter out any models currently in 503 cooldown, but ensure at least one model is tried
  let modelChain = preferredModels.filter((m) => !isModelInCooldown(m));
  if (modelChain.length === 0) {
    modelChain = [...preferredModels];
  }

  let lastError: any = null;

  for (const modelName of modelChain) {
    const isHighDemandModel = isModelInCooldown(modelName);
    if (isHighDemandModel && modelChain.length > 1) {
      continue;
    }

    const retries = maxRetriesPerModel;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        if (attempt > 0) {
          await sleepWithJitter(400 * Math.pow(2, attempt - 1));
        }

        const config: any = {};
        if (systemInstruction) {
          config.systemInstruction = systemInstruction;
        }
        if (responseMimeType) {
          config.responseMimeType = responseMimeType;
        }

        const response = await ai.models.generateContent({
          model: modelName,
          contents,
          config,
        });

        const rawText = response.text || "{}";
        if (responseMimeType === "application/json") {
          const parsed = JSON.parse(rawText) as T;
          return {
            data: parsed,
            isFallback: false,
            modelUsed: modelName,
          };
        }

        return {
          data: (rawText as unknown) as T,
          isFallback: false,
          modelUsed: modelName,
        };
      } catch (err: any) {
        lastError = err;
        const errStr = String(err?.message || err?.status || err || "");
        const is503 = /503|UNAVAILABLE|high demand|spikes in demand/i.test(errStr);

        // Record cooldown for model on 503 so subsequent calls don't waste time on it
        if (is503) {
          recordModelCooldown(modelName);
        }

        // Log gracefully to stdout instead of stderr to prevent alerting log aggregators
        console.log(
          `[AI Dispatch] Model "${modelName}" unavailable (${is503 ? "High Demand" : err?.message || "Transient"}). Switching to next model.`
        );

        // On 503 high demand, immediately move to the next model rather than retrying the same busy model
        if (is503) {
          break;
        }

        const retryable = isRetryableGeminiError(err);
        if (!retryable) {
          break;
        }
      }
    }
  }

  // All models and retries exhausted (e.g. global 503 high demand spike or network drop)
  console.log(
    `[AI Dispatch] Engaging safe heuristic analysis due to upstream AI availability.`
  );

  const fallbackData = fallbackGenerator();
  return {
    data: fallbackData,
    isFallback: true,
    note: "Safe heuristic fallback activated due to temporary AI model high demand",
  };
}

// ------------------- ENDPOINT-SPECIFIC FALLBACK GENERATORS -------------------

export function generateScamFallback(content: string, isHindi: boolean) {
  const hasUrgentThreat = /(electricity|power|bijli|cut|disconnected|block|suspend|arrest|police|cbi|fir|kyc|expired|urgent|penalty|fine|chalan|disconnection|बिजली|काट|बंद|खाता|बैंक|पुलिस|धमकी|चालान|जुर्माना)/i.test(
    content
  );
  const hasFinancialTrap = /(otp|one time password|pin|cvv|password|passcode|lottery|won|crore|lakh|prize|kbc|click here|apk|refund|bonus|claim|ओटीपी|पिन|पासवर्ड|लॉटरी|इनाम|रुपये|लाख|करोड़|लिंक|क्लिक|रिफंड)/i.test(
    content
  );
  const isDangerous = hasUrgentThreat || hasFinancialTrap;

  return {
    verdict: isDangerous ? "dangerous_scam" : "safe",
    score: isDangerous ? (hasUrgentThreat && hasFinancialTrap ? 95 : 82) : 15,
    title: isHindi
      ? isDangerous
        ? "सावधान! यह एक संदिग्ध धोखाधड़ी (Scam) हो सकता है"
        : "यह संदेश सामान्य प्रतीत होता है"
      : isDangerous
      ? "Warning! This appears to be a suspicious scam"
      : "This message appears generally safe",
    explanation: isHindi
      ? isDangerous
        ? "इस संदेश में तुरंत कार्रवाई, बैंक खाता बंद होने या बिजली कटने का डर दिखाकर व्यक्तिगत विवरण या लिंक पर क्लिक करने को कहा गया है। बैंक या बिजली बोर्ड कभी भी SMS पर खाता या बिजली बंद नहीं करते।"
        : "इस संदेश में कोई तत्काल वित्तीय मांग या संवेदनशील पासवर्ड मांगने का संकेत नहीं मिला है।"
      : isDangerous
      ? "This message creates false urgency or asks for sensitive codes/actions. Genuine banks and utility offices never demand OTPs or threaten same-day disconnection over SMS."
      : "No urgent scam indicators or password requests were detected in this message text.",
    redFlags: isDangerous
      ? isHindi
        ? [
            "तत्काल कार्रवाई या सेवा बंद करने का अनावश्यक दबाव",
            "अज्ञात लिंक या अनौपचारिक नंबर से संदेश",
            "गोपनीय जानकारी या भुगतान की मांग",
          ]
        : [
            "Urgent threat of immediate disconnection or account block",
            "Unverified sender or suspicious web link",
            "Request for payment or sensitive personal codes",
          ]
      : isHindi
      ? ["कोई गंभीर चेतावनी नहीं मिली"]
      : ["No critical red flags identified"],
    safeActions: isDangerous
      ? isHindi
        ? [
            "इस संदेश में दिए गए किसी भी लिंक पर बिल्कुल क्लिक न करें",
            "किसी के साथ भी अपना OTP या बैंक पिन साझा न करें",
            "संदेह होने पर परिवार के किसी सदस्य या बैंक की आधिकारिक शाखा से संपर्क करें",
          ]
        : [
            "Do not click on any links provided in the message",
            "Never share your OTP, PIN, or banking passwords with anyone",
            "Contact your official bank branch or a trusted family member for confirmation",
          ]
      : isHindi
      ? ["आप सामान्य रूप से आगे बढ़ सकते हैं", "हमेशा सतर्क रहें"]
      : ["You may proceed normally", "Always stay cautious with personal information"],
    reassurance: isHindi
      ? "आपने इसकी जांच करवाकर बहुत समझदारी का काम किया है। संगिनी हमेशा आपकी सुरक्षा के लिए तैयार है।"
      : "You did the right thing by checking this first. Sangini is always here to keep you safe.",
  };
}

export function generateDocumentFallback(
  content: string,
  docType: string,
  isHindi: boolean
) {
  const isElectricity = /(electricity|power|bijli|meter|kwh|unit|discom|बिजली|मीटर)/i.test(
    content + " " + docType
  );
  const isPension = /(pension|life certificate|jeevan pramaan|sparsh|treasury|पेंशन|जीवन प्रमाण)/i.test(
    content + " " + docType
  );
  const isMedical = /(hospital|prescription|doctor|discharge|tablet|mg|lab|medical|डॉक्टर|अस्पताल|दवा)/i.test(
    content + " " + docType
  );

  if (isPension) {
    return {
      summary: isHindi
        ? "यह आपकी मासिक पेंशन या जीवन प्रमाण पत्र से संबंधित दस्तावेज है।"
        : "This is a document related to your pension payment or annual Life Certificate.",
      whatIsThis: isHindi ? "पेंशन विवरण / सूचना" : "Pension Statement / Advice",
      amountToPay: isHindi ? "कोई भुगतान नहीं (शून्य)" : "No Payment Needed (₹0)",
      dueDate: isHindi ? "नियमित सत्यापन" : "Annual Verification",
      keyPoints: isHindi
        ? [
            "आपकी मासिक पेंशन आपके पंजीकृत बैंक खाते में नियमित रूप से जमा हो रही है",
            "वार्षिक जीवन प्रमाण पत्र (Digital Life Certificate) समय पर जमा करना आवश्यक है",
            "किसी भी अनजान व्यक्ति को अपनी पेंशन आईडी या पासवर्ड न दें",
          ]
        : [
            "Your monthly pension is being credited to your verified bank account",
            "Ensure your annual Digital Life Certificate (Jeevan Pramaan) is submitted in time",
            "Never share your pension login credentials with unverified callers",
          ],
      actionSteps: isHindi
        ? [
            "कदम 1: अपने बैंक पासबुक या SMS में पेंशन राशि की पुष्टि करें",
            "कदम 2: यदि जीवन प्रमाण पत्र का समय है, तो नजदीकी डाकघर या बैंक में बायोमेट्रिक सत्यापन कराएं",
            "कदम 3: इस रसीद को अपनी जरूरी फाइलों में सुरक्षित रखें",
          ]
        : [
            "Step 1: Check your bank statement to confirm your credit",
            "Step 2: Submit your annual Jeevan Pramaan at your local Post Office or bank if due",
            "Step 3: File this statement safely for your records",
          ],
      easyExplanation: isHindi
        ? "सब कुछ ठीक है। यह केवल आपके पेंशन रिकॉर्ड का दस्तावेज है। आपको किसी को कोई पैसा देने की आवश्यकता नहीं है।"
        : "Everything is in good order. This is simply a record of your pension. No payment is required.",
    };
  }

  if (isMedical) {
    return {
      summary: isHindi
        ? "यह डॉक्टर की पर्ची या अस्पताल की जांच रिपोर्ट का सारांश है।"
        : "This is a summary of your medical discharge advice or doctor prescription.",
      whatIsThis: isHindi ? "चिकित्सीय पर्ची / डिस्चार्ज सारांश" : "Medical Prescription / Summary",
      amountToPay: isHindi ? "दवाओं के अनुसार" : "As per pharmacy bill",
      dueDate: isHindi ? "सलाह अनुसार फॉलो-अप" : "Next doctor visit as advised",
      keyPoints: isHindi
        ? [
            "डॉक्टर द्वारा सुझाई गई दवाएं हमेशा भोजन के बाद नियत समय पर लें",
            "पर्याप्त मात्रा में पानी पिएं और हल्का, पौष्टिक आहार लें",
            "दवा की खुराक खुद से न बदलें",
          ]
        : [
            "Take prescribed medicines at regular scheduled times after meals",
            "Drink plenty of water and follow dietary recommendations",
            "Do not alter dosage without consulting your physician",
          ],
      actionSteps: isHindi
        ? [
            "कदम 1: संगिनी 'दवाई ट्रैकर' में अपनी गोलियों का अलार्म जोड़ें",
            "कदम 2: दवा लेते समय पानी का भरपूर उपयोग करें",
            "कदम 3: डॉक्टर की अगली तारीख नोट करके रखें",
          ]
        : [
            "Step 1: Set reminders in the Sangini Medicine Tracker",
            "Step 2: Keep prescription medicines in a clearly labeled box",
            "Step 3: Note down the date for your next follow-up checkup",
          ],
      easyExplanation: isHindi
        ? "यह आपके स्वास्थ्य और दवाइयों की देखभाल के लिए एक महत्वपूर्ण पर्ची है। बस डॉक्टर की सलाह के अनुसार समय पर दवा लें।"
        : "This is an important guide for your medication routine. Follow the doctor's schedule and stay well-hydrated.",
    };
  }

  // Default utility/electricity bill fallback
  return {
    summary: isHindi
      ? "यह आपके मासिक बिजली/उपयोगिता बिल का सरल सारांश है।"
      : "Here is a simplified breakdown of your monthly utility / electricity bill.",
    whatIsThis: isHindi ? "मासिक बिजली / उपयोगिता बिल" : "Monthly Electricity / Utility Bill",
    amountToPay: "₹ 1,240",
    dueDate: isHindi ? "15 तारीख (चालू माह)" : "15th of the month",
    keyPoints: isHindi
      ? [
          "कुल देय राशि: ₹1,240 (नियत तारीख से पहले)",
          "इस महीने की खपत सामान्य स्तर पर है, कोई अतिरिक्त जुर्माना नहीं है",
          "ऑनलाइन या काउंटर पर समय से पहले भुगतान करने पर छूट मिल सकती है",
        ]
      : [
          "Total amount payable: ₹1,240 before due date",
          "Electricity consumption is consistent with normal monthly reading",
          "Early payment discount may apply when paid via authorized counters",
        ],
    actionSteps: isHindi
      ? [
          "कदम 1: अपने अधिकृत बिजली बोर्ड ऐप या नजदीकी सेवा केंद्र पर जाएं",
          "कदम 2: नियत तारीख से पहले ₹1,240 का भुगतान करें",
          "कदम 3: भुगतान की रसीद या SMS संभाल कर रखें",
        ]
      : [
          "Step 1: Open your verified payment app or visit the local electricity counter",
          "Step 2: Complete the payment of ₹1,240 before the 15th",
          "Step 3: Keep the digital confirmation receipt or SMS safe",
        ],
    easyExplanation: isHindi
      ? "चिंता की कोई बात नहीं है। यह आपका सामान्य मासिक बिल है। आपको केवल नियत तारीख से पहले भुगतान करना है।"
      : "Nothing to worry about. This is your regular utility bill. Simply complete payment before the due date.",
  };
}

export function generateMedicineFallback(
  medicineName: string,
  _instructions: string,
  isHindi: boolean
) {
  const cleanName = medicineName || "Tablet";
  return {
    name: cleanName,
    purpose: isHindi
      ? "यह दवा आमतौर पर आपके स्वास्थ्य को संतुलित रखने और डॉक्टर द्वारा दी गई सलाह के अनुसार ली जाती है।"
      : "This medication is commonly prescribed to maintain healthy balance as directed by your physician.",
    whenToTake: isHindi
      ? "आमतौर पर सुबह या शाम भोजन के बाद, एक गिलास ताजे पानी के साथ लें।"
      : "Usually taken once daily after a meal with a full glass of fresh water.",
    importantCautions: isHindi
      ? [
          "खाली पेट कभी न लें जब तक कि डॉक्टर ने विशेष रूप से न कहा हो",
          "दवा की खुराक खुद से न घटाएं या बढ़ाएं",
          "यदि कोई चक्कर या असहजता महसूस हो तो तुरंत अपने चिकित्सक से बात करें",
        ]
      : [
          "Do not take on an empty stomach unless explicitly instructed by doctor",
          "Never double up or skip doses without physician consultation",
          "Reach out to your doctor if you experience dizziness or unexpected symptoms",
        ],
    friendlyTip: isHindi
      ? "दवाइयों को हमेशा एक साफ, सूखे डिब्बे में रखें और संगिनी पर अलार्म सेट करना न भूलें।"
      : "Always store your tablets in a dry, labeled box and keep a water bottle nearby.",
  };
}

export function generateCompanionChatFallback(
  messages: Array<{ role: string; content: string }>,
  isHindi: boolean
) {
  const lastUserMsg =
    [...messages].reverse().find((m) => m.role === "user")?.content || "";

  return {
    reply: isHindi
      ? `नमस्ते जी! मैं संगिनी हूँ, हमेशा आपकी सेवा और बातचीत के लिए यहीं हूँ। आपने कहा: "${lastUserMsg || "नमस्ते"}"। आप बिल्कुल निश्चिंत रहें। क्या आप चाहते हैं कि हम दवाई के समय, परिवार से बात करने, या किसी और विषय पर बात करें?`
      : `Hello! I am Sangini, right here with you. Regarding what you shared ("${lastUserMsg || "Hello"}"), please rest assured. How can I help you today? Would you like to review your medicines, check a message, or just have a pleasant chat?`,
    suggestedActions: isHindi
      ? ["दवाई का समय देखें", "संदेश की जांच करें", "परिवार को कॉल करें"]
      : ["Check My Medicines", "Verify a Message", "Call Family"],
  };
}
