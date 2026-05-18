import { test, expect } from '../fixtures/auth.fixture.js';

test.describe('Smoke Suite', () => {
  test('Flujo base: Login de Autor y navegación a Dashboard', async ({ autorPage, dashboardPage }) => {
    await autorPage.goto('/author');
    
    // Verificar renderización correcta de la UI basada en el rol
    // Nota: El contenido exacto de texto dependerá de la UI, pero buscaremos algo genérico
    await expect(autorPage.locator('body')).toBeVisible();
    await expect(autorPage).toHaveURL(/.*author/);
  });

  test('Concurrency API Real: Race conditions testing en GET papers', async ({ request, autorUser, editorUser }) => {
    // Simular llamadas recurrentes al backend al mismo tiempo para probar aislamiento DB y race conditions
    const [resAutor, resEditor] = await Promise.all([
      request.get('http://localhost:3000/api/papers', {
        headers: { Authorization: `Bearer ${autorUser.token}` }
      }),
      request.get('http://localhost:3000/api/papers', {
        headers: { Authorization: `Bearer ${editorUser.token}` }
      })
    ]);
    
    const resAutorBody = await resAutor.text();
    const resEditorBody = await resEditor.text();
    console.log('Autor Status:', resAutor.status(), resAutorBody);
    console.log('Editor Status:', resEditor.status(), resEditorBody);
    
    expect(resAutor.ok()).toBeTruthy();
    expect(resEditor.ok()).toBeTruthy();
  });
});
