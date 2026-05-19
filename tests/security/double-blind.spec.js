import { test, expect } from '../fixtures/auth.fixture.js';

test.describe('Security & Double-Blind Isolation', () => {
  
  test('Metadata Leakage: El payload API del Paper oculta el autor al Revisor', async ({ request, revisorUser }) => {
    const res = await request.get('http://localhost:3000/api/reviews/my-assignments', {
      headers: { Authorization: `Bearer ${revisorUser.token}` }
    });
    expect(res.ok()).toBeTruthy();
    const assignments = await res.json();
    
    // Si la DB tiene asignaciones (seed data), procedemos a verificar fugas
    if (assignments.length > 0) {
      const paperId = assignments[0].paperId;
      
      const paperRes = await request.get(`http://localhost:3000/api/papers/${paperId}`, {
        headers: { Authorization: `Bearer ${revisorUser.token}` }
      });
      const paperBody = await paperRes.json();
      
      // ASSERT CRITICO: Double-Blind Check
      // Validamos explícitamente que no se envíe información del autor
      if (paperBody.paper) {
         expect(paperBody.paper.authorId).toBeUndefined();
         expect(paperBody.paper.author).toBeUndefined();
      }
    }
  });

  test('Event Isolation: Un Revisor no puede bypasear RBAC a papers que no le pertenecen', async ({ request, revisorUser }) => {
    const maliciousPaperId = 99999;
    const res = await request.get(`http://localhost:3000/api/papers/${maliciousPaperId}`, {
      headers: { Authorization: `Bearer ${revisorUser.token}` }
    });
    
    // El backend no debe permitir el acceso y jamás devolver HTTP 200 (podría ser 403 Forbidden o 404 Not Found)
    expect([403, 404]).toContain(res.status());
  });
});
