// src/shared/history.js
// Helper para registrar eventos en el historial de un artículo.
// Se usa desde cualquier service que modifique el estado de un paper.

import prisma from '../config/prisma.js';

/**
 * @param {number} paperId
 * @param {string} event     - Descripción corta del evento
 * @param {string} [detail]  - Detalle opcional
 * @param {number} [userId]  - Usuario que generó el evento (null para sistema)
 */
export const logHistory = async (paperId, event, detail = '', userId = null) => {
  try {
    await prisma.paperHistory.create({
      data: { paperId, event, detail, userId },
    });
  } catch (err) {
    // El historial nunca debe bloquear la operación principal
    console.error('[History] Error registrando evento:', err.message);
  }
};
