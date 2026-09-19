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
  const isProduction = process.env.NODE_ENV === "production";
  const statusCode = typeof err.statusCode === "number" ? err.statusCode : 500;
  const message = err.message && !isProduction ? err.message : "An internal server error occurred. Please try again.";

  console.error(`[API Error] ${statusCode} - ${err.message || "Unknown error"}`);

  res.status(statusCode).json({
    error: message,
    code: err.code || "INTERNAL_ERROR",
  });
}
