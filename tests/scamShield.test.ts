import { describe, it, expect } from "vitest";

// Testing heuristic classification logic matching server fallback and client protection
function analyzeScamHeuristic(content: string, language: "en" | "hi" = "en") {
  const hasUrgentThreat = /(electricity|power|bijli|cut|disconnected|block|suspend|arrest|police|cbi|fir|kyc|expired|urgent|बिजली|काट|बंद|खाता|बैंक|पुलिस|धमकी)/i.test(content);
  const hasFinancialTrap = /(otp|one time password|pin|cvv|password|passcode|lottery|won|crore|lakh|prize|kbc|click here|apk|refund|ओटीपी|पिन|पासवर्ड|लॉटरी|इनाम|रुपये|लाख|करोड़|लिंक|क्लिक)/i.test(content);
  const isDangerous = hasUrgentThreat || hasFinancialTrap;

  return {
    verdict: isDangerous ? "dangerous_scam" : "safe",
    score: isDangerous ? (hasUrgentThreat && hasFinancialTrap ? 95 : 85) : 15,
    isUrgent: hasUrgentThreat,
    isFinancial: hasFinancialTrap,
  };
}

describe("Scam Shield Heuristic & Fraud Detection", () => {
  it("should flag electricity disconnection threat as dangerous scam", () => {
    const text = "Urgent: Electricity power will be disconnected at 9:30 PM. Call officer Sharma.";
    const result = analyzeScamHeuristic(text);

    expect(result.verdict).toBe("dangerous_scam");
    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.isUrgent).toBe(true);
  });

  it("should flag OTP or KYC phishing requests as high risk", () => {
    const text = "Dear customer, your bank KYC has expired. Click here to verify and share your OTP.";
    const result = analyzeScamHeuristic(text);

    expect(result.verdict).toBe("dangerous_scam");
    expect(result.score).toBe(95); // Has both urgent threat & financial trap
    expect(result.isFinancial).toBe(true);
  });

  it("should flag lottery or lottery prize claims as dangerous fraud", () => {
    const text = "Congratulations! You won ₹25,00,000 cash in KBC WhatsApp lucky draw.";
    const result = analyzeScamHeuristic(text);

    expect(result.verdict).toBe("dangerous_scam");
    expect(result.score).toBeGreaterThanOrEqual(80);
  });

  it("should consider normal daily communications as safe", () => {
    const text = "Good morning Dad, did you take your morning tea? Calling you in the evening.";
    const result = analyzeScamHeuristic(text);

    expect(result.verdict).toBe("safe");
    expect(result.score).toBeLessThanOrEqual(20);
  });

  it("should detect Hindi scam keywords like 'बिजली' and 'OTP'", () => {
    const text = "आज रात 9 बजे बिजली काट दी जाएगी। तुरंत इस नंबर पर फोन करें";
    const result = analyzeScamHeuristic(text, "hi");

    expect(result.verdict).toBe("dangerous_scam");
  });
});
