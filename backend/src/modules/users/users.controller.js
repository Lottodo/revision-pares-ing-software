// src/modules/users/users.controller.js
import * as svc from './users.service.js';
import { ok, fail, serverError } from '../../shared/response.js';

const handle = (fn) => async (req, res) => {
  try { return ok(res, await fn(req, res)); }
  catch (err) { return err.status ? fail(res, err.message, err.status) : serverError(res, err); }
};

export const listAll       = handle((req) => svc.listAll());
export const getById       = handle((req) => svc.getById(parseInt(req.params.id)));
export const updateUser    = handle((req) => svc.updateUser(parseInt(req.params.id), req.body));
export const assignRole    = handle((req) => svc.assignRole(req.body));
export const removeRole    = handle((req) => svc.removeRole(req.body));
export const getUsersByEvent   = handle((req) => svc.getUsersByEvent(parseInt(req.params.eventId)));
export const getReviewersByEvent = handle((req) => svc.getReviewersByEvent(parseInt(req.params.eventId), req.query.paperId ? parseInt(req.query.paperId) : null));
