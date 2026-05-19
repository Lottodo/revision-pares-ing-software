// src/modules/invitations/invitations.controller.js
import * as svc from './invitations.service.js';
import { ok, created, fail, serverError } from '../../shared/response.js';

const handle = (fn) => async (req, res) => {
  try { return ok(res, await fn(req, res)); }
  catch (err) { return err.status ? fail(res, err.message, err.status) : serverError(res, err); }
};

// POST /invitations  — Admin envía invitación
export const sendInvitation = async (req, res) => {
  try {
    const data = await svc.sendInvitation({
      eventId: parseInt(req.body.eventId),
      email:    req.body.email || null,
      username: req.body.username || null,
      role:     req.body.role,
    });
    return created(res, data);
  } catch (err) {
    return err.status ? fail(res, err.message, err.status) : serverError(res, err);
  }
};

// GET /invitations/my  — Usuario ve sus invitaciones pendientes
export const myInvitations = handle((req) => svc.myInvitations(req.user.id));

// PATCH /invitations/:token/respond  — Usuario acepta o rechaza
export const respond = handle((req) =>
  svc.respondToInvitation(req.user.id, req.params.token, req.body.accept === true)
);

// GET /invitations/event/:eventId  — Admin lista invitaciones de un evento
export const listByEvent = handle((req) =>
  svc.listByEvent(parseInt(req.params.eventId))
);

// DELETE /invitations/:id  — Admin cancela una invitación pendiente
export const cancelInvitation = handle((req) =>
  svc.cancelInvitation(parseInt(req.params.id))
);
