// src/modules/papers/papers.controller.js
import * as svc from './papers.service.js';
import { ok, created, fail, serverError } from '../../shared/response.js';
import { env } from '../../config/env.js';

const handle = (fn) => async (req, res) => {
  try { return ok(res, await fn(req, res)); }
  catch (err) { return err.status ? fail(res, err.message, err.status) : serverError(res, err); }
};

export const listByEvent = handle((req) =>
  svc.listByEvent(req.user.eventId, req.user)
);

export const getById = handle((req) =>
  svc.getById(parseInt(req.params.id), req.user.eventId, req.user)
);

export const create = async (req, res) => {
  try {
    if (!req.file) return fail(res, 'Se requiere un archivo PDF.', 400);
    const documentUrl = `/uploads/${req.file.filename}`;
    const paper = await svc.create({
      ...req.body,
      documentUrl,
      eventId:  req.user.eventId,
      authorId: req.user.id,
    });
    return created(res, paper);
  } catch (err) {
    return err.status ? fail(res, err.message, err.status) : serverError(res, err);
  }
};

export const addVersion = async (req, res) => {
  try {
    if (!req.file) return fail(res, 'Se requiere un archivo PDF.', 400);
    const documentUrl = `/uploads/${req.file.filename}`;
    const result = await svc.addVersion(
      parseInt(req.params.id),
      req.user.eventId,
      { documentUrl, note: req.body.note },
      req.user.id
    );
    return ok(res, result);
  } catch (err) {
    return err.status ? fail(res, err.message, err.status) : serverError(res, err);
  }
};

export const updateStatus = handle((req) =>
  svc.updateStatus(parseInt(req.params.id), req.user.eventId, req.body.status, req.user.id)
);

export const getHistory = handle((req) =>
  svc.getHistory(parseInt(req.params.id), req.user.eventId, req.user)
);
