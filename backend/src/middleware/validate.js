import { z } from 'zod';

export function validate(schema) {
  return (req, res, next) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        const fieldName = firstError.path.join('.');
        const errorMessage = fieldName 
          ? `${fieldName}: ${firstError.message}`
          : firstError.message;
        
        const allErrors = error.errors.map(err => ({
          field: err.path.join('.') || 'root',
          message: err.message
        }));
        
        return res.status(400).json({
          status: 'error',
          error: errorMessage,
          errors: allErrors,
          code: 'VALIDATION_ERROR'
        });
      }
      next(error);
    }
  };
}

