import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

export interface ApiErrorResponse {
  error: string;
  code: string;
  details?: unknown;
}

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Handle Zod Validation Errors
  if (err instanceof ZodError) {
    res.status(400).json({
      error: "Invalid request payload or parameters",
      code: "VALIDATION_ERROR",
      details: err.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
    return;
  }

  // Handle Payload Too Large (e.g. from body-parser)
  if (err.type === "entity.too.large" || err.status === 413) {
    res.status(413).json({
      error: "Uploaded payload or image is too large (maximum 8MB)",
      code: "PAYLOAD_TOO_LARGE",
    });
    return;
  }

  // Safe fallback for standard errors
  let statusCode = typeof err.statusCode === "number" ? err.statusCode : typeof err.status === "number" ? err.status : 500;
  let rawMessage = err.message || "";
  let isHighDemand = false;

  // Try parsing embedded JSON error if message is stringified JSON
  try {
    if (typeof rawMessage === "string" && rawMessage.trim().startsWith("{")) {
      const parsedErr = JSON.parse(rawMessage);
      if (parsedErr?.error?.code === 503 || parsedErr?.error?.status === "UNAVAILABLE") {
        statusCode = 503;
        isHighDemand = true;
      } else if (parsedErr?.error?.message) {
        rawMessage = parsedErr.error.message;
      }
    }
  } catch {
    // Keep rawMessage
  }

  if (
    /503|UNAVAILABLE|high demand|spikes in demand|temporarily unavailable/i.test(rawMessage)
  ) {
    statusCode = 503;
    isHighDemand = true;
  }

  console.error(`[API Error] ${statusCode} - ${rawMessage || "Unknown error"}`);

  if (isHighDemand) {
    res.status(503).json({
      error:
        "The AI service is temporarily experiencing high demand. Sangini has safe offline heuristics ready. Please try again in a few moments.",
      code: "AI_SERVICE_HIGH_DEMAND",
      retryAfter: 5,
    });
    return;
  }

  const isProduction = process.env.NODE_ENV === "production";
  const userMessage =
    rawMessage && !isProduction
      ? rawMessage
      : "An internal server error occurred. Please try again.";

  res.status(statusCode).json({
    error: userMessage,
    code: err.code || "INTERNAL_ERROR",
  });
}
