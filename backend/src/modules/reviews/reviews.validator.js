// src/modules/reviews/reviews.validator.js
import { z } from 'zod';

const rubricField = z.coerce.number().int().min(1, 'Mínimo 1').max(5, 'Máximo 5');

export const createAssignmentSchema = z.object({
  paperId:    z.coerce.number().int().positive(),
  reviewerId: z.coerce.number().int().positive(),
  deadline:   z.coerce.date().optional(),
});

export const removeAssignmentSchema = z.object({
  paperId:    z.coerce.number().int().positive(),
  reviewerId: z.coerce.number().int().positive(),
});

export const submitReviewSchema = z.object({
  assignmentId:        z.coerce.number().int().positive(),
  verdict:             z.enum(['ACCEPT', 'MINOR_CHANGES', 'MAJOR_CHANGES', 'REJECT']),
  originality:         rubricField,
  methodologicalRigor: rubricField,
  writingQuality:      rubricField,
  relevance:           rubricField,
  comments:            z.string().min(20, 'Los comentarios deben tener al menos 20 caracteres'),
});

export const assignmentIdParamSchema = z.object({
  assignmentId: z.coerce.number().int().positive(),
});

export const paperIdParamSchema = z.object({
  paperId: z.coerce.number().int().positive(),
});
