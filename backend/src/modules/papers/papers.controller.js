// src/modules/papers/papers.controller.js
import * as svc from './papers.service.js';
import { ok, created, fail, serverError } from '../../shared/response.js';
import { env } from '../../config/env.js';
import path from 'node:path';
import fs from 'node:fs';

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
  svc.updateStatus(parseInt(req.params.id), req.user.eventId, req.body.status, req.user.id, req.body.editorComment)
);

export const getHistory = handle((req) =>
  svc.getHistory(parseInt(req.params.id), req.user.eventId, req.user)
);

export const addHistoryNote = handle((req) =>
  svc.addHistoryNote(parseInt(req.params.id), req.user.eventId, req.user, req.body.note)
);

export const downloadPdf = async (req, res) => {
  try {
    const filePathParam = req.query.path;
    if (!filePathParam) return fail(res, 'Falta el parámetro path.', 400);

    // Verificar autorización a nivel de servicio
    await svc.verifyPdfAccess(filePathParam, req.user);
    
    const filePath = path.join(env.uploadsDir, filePathParam);
    if (!fs.existsSync(filePath)) {
      return fail(res, 'Archivo no encontrado.', 404);
    }
    
    res.download(filePath);
  } catch (err) {
    return err.status ? fail(res, err.message, err.status) : serverError(res, err);
  }
};
