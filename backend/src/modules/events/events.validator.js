// src/modules/events/events.validator.js
import { z } from 'zod';

export const createEventSchema = z.object({
  slug:        z.string().min(3).max(100).regex(/^[a-z0-9-]+$/, 'Solo minúsculas, números y guiones'),
  name:        z.string().min(3).max(200),
  description: z.string().optional(),
  startDate:   z.coerce.date().optional(),
  endDate:     z.coerce.date().optional(),
  active:      z.boolean().default(true),
});

export const updateEventSchema = createEventSchema.partial().refine(
  (d) => Object.keys(d).length > 0,
  { message: 'Al menos un campo requerido' }
);

export const eventIdParamSchema = z.object({
  id: z.coerce.number().int().positive('ID de evento inválido'),
});
