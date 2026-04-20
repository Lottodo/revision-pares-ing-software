// src/modules/auth/auth.validator.js
import { z } from 'zod';

export const registerSchema = z.object({
  username: z
    .string()
    .min(3, 'Mínimo 3 caracteres')
    .max(50, 'Máximo 50 caracteres')
    .regex(/^[a-zA-Z0-9_]+$/, 'Solo letras, números y guiones bajos'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});

export const loginSchema = z.object({
  username: z.string().min(1, 'Username requerido'),
  password: z.string().min(1, 'Password requerido'),
  // eventId opcional: si no viene, el token no tendrá contexto de evento
  eventId: z.coerce.number().int().positive().optional(),
});

export const switchEventSchema = z.object({
  eventId: z.coerce.number().int().positive('eventId debe ser un entero positivo'),
});
