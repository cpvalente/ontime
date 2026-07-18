import type { NextFunction, Request, Response } from 'express';
import { z, type ZodType } from 'zod';

type Target = 'body' | 'params';

/**
 * Builds an Express middleware that safe-parses req[target] against `schema`.
 * - Uses safeParse: no throw/catch on the hot invalid-input path.
 * - On success, replaces req[target] with the parsed value (defaults filled,
 *   unknown keys stripped, .trim()/.transform() applied) and calls next().
 * - On failure, responds 422 with { errors: [...] }.
 */
function validate<T extends ZodType>(target: Target, schema: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        location: target,
        path: issue.path.join('.'),
        message: issue.message,
      }));
      res.status(422).json({ errors });
      return;
    }
    req[target] = result.data;
    next();
  };
}

export const validateBody = <T extends ZodType>(schema: T) => validate('body', schema);
export const validateParams = <T extends ZodType>(schema: T) => validate('params', schema);

/** Direct replacement for the old paramsWithId */
export const idParamSchema = z.object({ id: z.string().trim().min(1) });
export const validateIdParam = validateParams(idParamSchema);

/**
 * Direct replacement for requestValidationFunctionWithFile — unrelated to Zod (it's a
 * check on multer's req.file, not on body/params shape), kept as its own middleware.
 */
export function requireUploadedFile(req: Request & { file?: unknown }, res: Response, next: NextFunction) {
  if (!req.file) {
    res.status(422).json({ errors: 'File not found' });
    return;
  }
  next();
}
