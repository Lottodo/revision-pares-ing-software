// src/modules/auth/auth.controller.js
// Solo maneja HTTP: extrae datos del request, llama al service, devuelve respuesta.
// CERO lógica de negocio aquí.

import * as authService from './auth.service.js';
import { ok, created, fail, serverError } from '../../shared/response.js';

export const register = async (req, res) => {
  try {
    const user = await authService.register(req.body);
    return created(res, user);
  } catch (err) {
    if (err.status) return fail(res, err.message, err.status);
    return serverError(res, err);
  }
};

export const login = async (req, res) => {
  try {
    const result = await authService.login(req.body);
    return ok(res, result);
  } catch (err) {
    if (err.status) return fail(res, err.message, err.status);
    return serverError(res, err);
  }
};

export const switchEvent = async (req, res) => {
  try {
    const { eventId } = req.body;
    const result = await authService.switchEvent(req.user.id, eventId);
    return ok(res, result);
  } catch (err) {
    if (err.status) return fail(res, err.message, err.status);
    return serverError(res, err);
  }
};

export const me = async (req, res) => {
  try {
    const user = await authService.getMe(req.user.id);
    return ok(res, user);
  } catch (err) {
    if (err.status) return fail(res, err.message, err.status);
    return serverError(res, err);
  }
};

export const logout = async (req, res) => {
  try {
    // Limpiar el sessionId para desloguear de todos los dispositivos
    await authService.logout(req.user.id);
    return ok(res, { message: 'Sesión cerrada.' });
  } catch (err) {
    return serverError(res, err);
  }
};
