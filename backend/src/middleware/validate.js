// src/middleware/validate.js
// Middleware genérico de validación con Zod.
// Valida body, params y query contra un schema Zod.
//
// Uso:
//   router.post('/papers', validate(createPaperSchema), controller.create)

import { fail } from '../shared/response.js';

/**
 * @param {import('zod').ZodSchema} schema - Schema Zod a validar
 * @param {'body'|'params'|'query'} source - Fuente de los datos (default: body)
 */
export const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const errors = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
      return fail(res, errors.join('; '), 422);
    }

    // Reemplaza los datos con los valores parseados (con coerciones de Zod aplicadas)
    req[source] = result.data;
    next();
  };
};
