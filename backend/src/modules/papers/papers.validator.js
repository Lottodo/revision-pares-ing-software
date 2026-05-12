// src/modules/papers/papers.validator.js
import { z } from 'zod';

export const createPaperSchema = z.object({
  title:    z.string().min(5, 'Mínimo 5 caracteres').max(200, 'Máximo 200 caracteres'),
  abstract: z.string().min(50, 'El resumen debe tener al menos 50 caracteres'),
});

export const updateStatusSchema = z.object({
  status: z.enum(
    ['RECEIVED', 'UNDER_REVIEW', 'MINOR_CHANGES', 'MAJOR_CHANGES', 'ACCEPTED', 'REJECTED', 'COMPLETED'],
    { errorMap: () => ({ message: 'Estado inválido. Valores permitidos: RECEIVED, UNDER_REVIEW, MINOR_CHANGES, MAJOR_CHANGES, ACCEPTED, REJECTED, COMPLETED' }) }
  ),
  editorComment: z.string().max(1000).optional(),
});

export const paperIdParamSchema = z.object({
  id: z.coerce.number().int().positive('ID de artículo inválido'),
});

export const addVersionNoteSchema = z.object({
  note: z.string().max(500).optional(),
});
