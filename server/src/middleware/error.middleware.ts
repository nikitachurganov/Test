import { Request, Response, NextFunction } from 'express';

interface HttpError extends Error {
  statusCode?: number;
}

export const errorMiddleware = (
  err: HttpError,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void => {
  console.error(`[error] ${err.message}`, err.stack);

  const statusCode = err.statusCode ?? 500;

  // Never leak internal details in production for 5xx errors
  const message =
    process.env.NODE_ENV === 'production' && statusCode >= 500
      ? 'Internal Server Error'
      : err.message;

  res.status(statusCode).json({ error: message });
};
