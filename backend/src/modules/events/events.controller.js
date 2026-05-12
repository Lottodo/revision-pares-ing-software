// src/modules/events/events.controller.js
import * as svc from './events.service.js';
import { ok, created, fail, serverError } from '../../shared/response.js';

const handle = (fn) => async (req, res) => {
  try { return ok(res, await fn(req, res)); }
  catch (err) { return err.status ? fail(res, err.message, err.status) : serverError(res, err); }
};

export const listAll   = handle(() => svc.listAll());
export const getById   = handle((req) => svc.getById(parseInt(req.params.id)));
export const getBySlug = handle((req) => svc.getBySlug(req.params.slug));
export const getStats  = handle((req) => svc.getStats(parseInt(req.params.id)));
export const update    = handle((req) => svc.update(parseInt(req.params.id), req.body));

export const create = async (req, res) => {
  try { return created(res, await svc.create(req.body)); }
  catch (err) { return err.status ? fail(res, err.message, err.status) : serverError(res, err); }
};

export const remove = async (req, res) => {
  try { return ok(res, await svc.remove(parseInt(req.params.id))); }
  catch (err) { return err.status ? fail(res, err.message, err.status) : serverError(res, err); }
};

export const joinEvent = async (req, res) => {
  try { 
    return ok(res, await svc.joinByCode(req.user.id, req.body.accessCode)); 
  }
  catch (err) { 
    return err.status ? fail(res, err.message, err.status) : serverError(res, err); 
  }
};
