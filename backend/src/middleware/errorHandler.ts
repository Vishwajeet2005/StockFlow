import { Request, Response, NextFunction } from 'express';
import * as Sentry from '@sentry/node';

/**
 * Global Error Handler Middleware
 * Intercepts all uncaught errors, masks them from the client to prevent structure leaks,
 * and logs them securely to Sentry.
 */
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  // Capture error in Sentry
  Sentry.captureException(err);

  // Log to console for local debugging (hackathon friendly)
  console.error('[Error Masked]:', err.message || err);

  // If the headers are already sent, we must delegate to the default Express error handler
  if (res.headersSent) {
    return next(err);
  }

  // Determine HTTP status code
  const statusCode = err.status || err.statusCode || 500;

  // Mask the error message for production security
  // We don't want to expose SQL syntax errors or internal variable names
  let clientMessage = 'Internal server error';
  if (statusCode !== 500 && err.message) {
    // It's safe to send 400-level error messages (like 'Invalid token' or 'Not found')
    clientMessage = err.message;
  }

  res.status(statusCode).json({ error: clientMessage });
};
