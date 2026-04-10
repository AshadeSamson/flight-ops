import { Request, Response, NextFunction } from "express";

export default function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  const statusCode = err?.statusCode || err?.status || 500;
  const message = err?.message || "Internal server error";
  const errors = err?.errors ?? null;

  // Log the full error on the server for diagnostics
  console.error(err);

  const payload: any = {
    success: false,
    message,
    statusCode,
    path: req.originalUrl,
    timestamp: new Date().toISOString(),
  };

  if (errors) payload.errors = errors;

  res.status(statusCode).json(payload);
}
