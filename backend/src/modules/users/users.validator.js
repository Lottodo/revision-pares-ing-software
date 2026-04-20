// src/modules/users/users.validator.js
import { z } from 'zod';

const validRoles = ['AUTHOR', 'REVIEWER', 'EDITOR', 'ADMIN'];

export const assignRoleSchema = z.object({
  userId:  z.coerce.number().int().positive(),
  eventId: z.coerce.number().int().positive(),
  role:    z.enum(validRoles, { errorMap: () => ({ message: `Rol debe ser: ${validRoles.join(', ')}` }) }),
});

export const removeRoleSchema = z.object({
  userId:  z.coerce.number().int().positive(),
  eventId: z.coerce.number().int().positive(),
  role:    z.enum(validRoles),
});

export const updateUserSchema = z.object({
  email:    z.string().email().optional(),
  active:   z.boolean().optional(),
}).refine((d) => Object.keys(d).length > 0, { message: 'Al menos un campo es requerido' });

export const userIdParamSchema = z.object({
  id: z.coerce.number().int().positive('ID de usuario inválido'),
});
