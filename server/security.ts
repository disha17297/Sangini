import { Request, Response, NextFunction } from "express";
import { z } from "zod";

/**
 * Sanitizes plain text input by stripping dangerous control characters,
 * script tags, and prompt injection patterns.
 */
export function sanitizeInput(input: unknown, maxLength = 5000): string {
  if (typeof input !== "string") {
    return "";
  }

  // 1. Remove null bytes and non-printable control characters (except newline, tab, carriage return)
  let cleaned = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

  // 2. Strip explicit HTML script, iframe, object or embed blocks including contents to protect against XSS
  cleaned = cleaned.replace(/<(script|iframe|object|embed|style)[^>]*>[\s\S]*?<\/\1>/gi, "");
  cleaned = cleaned.replace(/<\/?(script|iframe|object|embed|style|svg)[^>]*>/gi, "");

  // 3. Neutralize common LLM prompt injection markers
  cleaned = cleaned
    .replace(/(?:system\s*:|assistant\s*:|human\s*:)/gi, "[REDACTED_ROLE]:")
    .replace(/(?:ignore|disregard|forget)\s+(?:all\s+)?(?:previous|prior)\s+(?:instructions|prompts|directions)/gi, "[DISALLOWED_INSTRUCTION]");

  // 4. Enforce strict maximum length
  if (cleaned.length > maxLength) {
    cleaned = cleaned.slice(0, maxLength);
  }

  return cleaned.trim();
}

/**
 * Validates base64 image data and allowed MIME types.
 */
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export function validateImagePayload(
  imageBase64?: unknown,
  mimeType?: unknown
): { valid: boolean; error?: string; cleanBase64?: string } {
  if (!imageBase64) {
    return { valid: true };
  }

  if (typeof imageBase64 !== "string") {
    return { valid: false, error: "Image data must be a base64 encoded string" };
  }

  if (typeof mimeType !== "string" || !ALLOWED_MIME_TYPES.has(mimeType.toLowerCase())) {
    return {
      valid: false,
      error: "Invalid or unsupported image MIME type. Supported: JPEG, PNG, WEBP, GIF",
    };
  }

  // Strip possible data URI header
  const rawBase64 = imageBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, "");

  // Check approximate decoded size (base64 is ~4/3 of binary size). 5MB max binary ~ 6.7MB base64
  if (rawBase64.length > 7 * 1024 * 1024) {
    return { valid: false, error: "Image exceeds maximum allowed size of 5MB" };
  }

  // Verify valid base64 character set
  const base64Regex = /^[A-Za-z0-9+/=]+$/;
  if (!base64Regex.test(rawBase64.replace(/\s+/g, ""))) {
    return { valid: false, error: "Invalid base64 encoding format" };
  }

  return { valid: true, cleanBase64: rawBase64 };
}

// ---------------------- ZOD SCHEMAS ----------------------

export const ScamCheckSchema = z.object({
  content: z.string().max(5000).optional().default(""),
  imageBase64: z.string().max(8 * 1024 * 1024).optional(),
  mimeType: z.string().max(50).optional(),
  language: z.enum(["en", "hi"]).default("en"),
});

export const DocumentSimplifySchema = z.object({
  content: z.string().max(10000).optional().default(""),
  imageBase64: z.string().max(8 * 1024 * 1024).optional(),
  mimeType: z.string().max(50).optional(),
  docType: z.string().max(100).optional().default("bill"),
  language: z.enum(["en", "hi"]).default("en"),
});

export const MedInfoSchema = z.object({
  medicineName: z.string().min(1, "Medicine name is required").max(150),
  instructions: z.string().max(1000).optional().default(""),
  language: z.enum(["en", "hi"]).default("en"),
});

export const ChatMessageSchema = z.object({
  role: z.enum(["user", "model", "assistant"]),
  content: z.string().min(1).max(3000),
});

export const CompanionChatSchema = z.object({
  messages: z.array(ChatMessageSchema).min(1).max(30),
  language: z.enum(["en", "hi"]).default("en"),
  userProfile: z
    .object({
      name: z.string().max(100).optional(),
    })
    .optional(),
});

/**
 * Express middleware applying enterprise HTTP security headers
 */
export function securityHeadersMiddleware(
  _req: Request,
  res: Response,
  next: NextFunction
): void {
  // Prevent MIME type sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");
  // Cross-site scripting filter
  res.setHeader("X-XSS-Protection", "1; mode=block");
  // Referrer policy
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  // Disallow insecure embeddings while supporting AI Studio preview iframe
  res.setHeader("X-DNS-Prefetch-Control", "off");
  // Feature policy / Permissions policy
  res.setHeader("Permissions-Policy", "microphone=(self), geolocation=(), camera=()");
  // Remove Express fingerprint
  res.removeHeader("X-Powered-By");

  next();
}
