import { AppError } from '../utils/errors.js';

export function validateBody(schema) {
  return (req, res, next) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return next(
        new AppError(
          400,
          'VALIDATION_ERROR',
          `${firstIssue.path.join('.') || 'Input'}: ${firstIssue.message}`,
          parsed.error.issues
        )
      );
    }
    req.body = parsed.data;
    next();
  };
}
