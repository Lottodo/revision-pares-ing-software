// src/shared/consolidateEvents.js
/**
 * Convierte un array de EventUser en un mapa { event, roles[] } por evento.
 * @param {Array} eventRoles - resultado de prisma.eventUser.findMany con include event
 */
export const consolidateEvents = (eventRoles) => {
  const map = {};
  for (const er of eventRoles) {
    if (!map[er.eventId]) map[er.eventId] = { event: er.event, roles: [] };
    map[er.eventId].roles.push(er.role);
  }
  return Object.values(map);
};
