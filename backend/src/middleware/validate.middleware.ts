import { Request, Response, NextFunction } from 'express';
import { ZodTypeAny, ZodError } from 'zod';
import { sendError } from '../utils/response.js';

export function validateRequest(schema: {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
}) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (schema.body) {
        req.body = await schema.body.parseAsync(req.body);
      }
      if (schema.query) {
        req.query = (await schema.query.parseAsync(req.query)) as Request['query'];
      }
      if (schema.params) {
        req.params = (await schema.params.parseAsync(req.params)) as Request['params'];
      }
      next();
    } catch (err: unknown) {
      if (err instanceof ZodError) {
        const issues = err.issues.map((i) => ({
          field: i.path.join('.'),
          message: i.message,
        }));
        const summary = issues.map((i) => i.message).filter(Boolean).join('; ');
        const message = summary ? `Validation failed: ${summary}` : 'Request validation failed';
        sendError(res, 400, 'VALIDATION_ERROR', message, issues);
        return;
      }
      next(err);
    }
  };
}
