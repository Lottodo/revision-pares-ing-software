import { z } from 'zod';

// Campo base para la rúbrica (decimales permitidos)
const rubricField = z.coerce.number().min(1, 'Mínimo 1').max(5, 'Máximo 5');

// NUEVO: Campo base para borradores (permite 0 y no es obligatorio llegar al 1)
const draftRubricField = z.coerce.number().min(0).max(5).optional();

export const createAssignmentSchema = z.object({
  paperId:    z.coerce.number().int().positive(),
  reviewerId: z.coerce.number().int().positive(),
  deadline:   z.coerce.date().optional(),
});

export const removeAssignmentSchema = z.object({
  paperId:    z.coerce.number().int().positive(),
  reviewerId: z.coerce.number().int().positive(),
});

// ─────────────────────────────────────────────────────────────────
// ESQUEMA PARA ENVÍO FINAL (submitReviewSchema)
// ─────────────────────────────────────────────────────────────────
export const submitReviewSchema = z.object({
  assignmentId:        z.coerce.number().int().positive(),
  verdict:             z.enum(['ACCEPT', 'MINOR_CHANGES', 'MAJOR_CHANGES', 'REJECT']),
  originality:         rubricField,
  methodologicalRigor: rubricField,
  writingQuality:      rubricField,
  relevance:           rubricField,
  comments:            z.string().min(20, 'Los comentarios deben tener al menos 20 caracteres'),
});

// ─────────────────────────────────────────────────────────────────
// NUEVO: ESQUEMA PARA GUARDAR BORRADOR (saveDraftSchema)
// ─────────────────────────────────────────────────────────────────
export const saveDraftSchema = z.object({
  assignmentId:        z.coerce.number().int().positive(),
  // En el borrador, el veredicto es opcional
  verdict:             z.enum(['ACCEPT', 'MINOR_CHANGES', 'MAJOR_CHANGES', 'REJECT']).optional(),
  originality:         draftRubricField,
  methodologicalRigor: draftRubricField,
  writingQuality:      draftRubricField,
  relevance:           draftRubricField,
  // En el borrador, los comentarios pueden estar vacíos
  comments:            z.string().optional(),
});

export const assignmentIdParamSchema = z.object({
  assignmentId: z.coerce.number().int().positive(),
});

export const paperIdParamSchema = z.object({
  paperId: z.coerce.number().int().positive(),
});