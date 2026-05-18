import { test, expect } from '../fixtures/auth.fixture.js';
import path from 'path';

test.describe('Editor Workflow E2E - Asignación y Doble Ciego', () => {

  test('El editor asigna un revisor y el autor ve el cambio sin conocer su identidad', async ({ page, autorUser, editorUser }) => {
    // Viewport fijo para que el video de evidencia no tenga problemas de zoom
    await page.setViewportSize({ width: 1280, height: 900 });

    // ----------------------------------------------------------------------
    // FASE 1: EL AUTOR SUBE EL ARTÍCULO (Pre-requisito)
    // ----------------------------------------------------------------------
    // Inicializamos sesión como Autor en la misma página
    await page.goto('/');
    await page.evaluate((authData) => {
      localStorage.clear();
      localStorage.setItem('token', authData.token);
      localStorage.setItem('user', JSON.stringify(authData.user));
      localStorage.setItem('activeEvent', authData.activeEvent);
      localStorage.setItem('userEvents', authData.userEvents);
    }, autorUser);

    await page.goto('/author');

    const uniqueTitle = `Paper de prueba para Editor ${Date.now()}`;
    const btnSubir = page.locator('button', { hasText: /Subir Artículo/i }).first();
    await expect(btnSubir).toBeVisible({ timeout: 10000 });
    await btnSubir.click();

    const pdfPath = path.resolve(__dirname, '../../PAPERS/COMPUTACION/paper_COMPUTACION_1.pdf');
    await page.locator('input[type="file"]').setInputFiles(pdfPath);
    await page.getByLabel(/título|title/i).fill(uniqueTitle);
    await page.getByLabel(/abstract|resumen/i).fill('Resumen automatizado para probar el flujo de asignación del editor.');

    const dialogAutor = page.getByRole('dialog');
    await dialogAutor.locator('button', { hasText: /enviar|guardar|subir/i }).click();
    await expect(dialogAutor).not.toBeVisible();

    // Verificamos que el artículo fue subido con éxito
    const authorCard = page.locator('.v-card', { hasText: uniqueTitle }).first();
    await expect(authorCard).toBeVisible();
    await expect(authorCard).toContainText(/Recibido/i);

    // ----------------------------------------------------------------------
    // FASE 2: EL EDITOR ASIGNA EL REVISOR
    // ----------------------------------------------------------------------
    // Cambiamos de sesión al Editor en la MISMA página (para grabar un solo video continuo)
    await page.evaluate((authData) => {
      localStorage.clear();
      localStorage.setItem('token', authData.token);
      localStorage.setItem('user', JSON.stringify(authData.user));
      localStorage.setItem('activeEvent', authData.activeEvent);
      localStorage.setItem('userEvents', authData.userEvents);
    }, editorUser);

    await page.goto('/editor');

    // Buscar la fila del artículo recién subido
    const filaPaper = page.locator('tr', { hasText: uniqueTitle }).first();
    await expect(filaPaper).toBeVisible({ timeout: 10000 });

    // Dar clic en el botón de opciones de la fila
    await filaPaper.locator('button').first().click();

    // Verificamos que se abra el Drawer "Gestión del Artículo"
    const drawer = page.locator('.v-navigation-drawer', { hasText: 'Gestión del Artículo' });
    await expect(drawer).toBeVisible();

    // Asignar el revisor
    const selectRevisor = drawer.locator('input[placeholder="Seleccionar revisor"]');
    await selectRevisor.click({ force: true });

    const listaRevisores = page.locator('.v-list-item', { hasText: 'revisor_pro' }).first();
    await expect(listaRevisores).toBeVisible();
    await listaRevisores.click();
    await page.waitForTimeout(500); // Pausa visual para ver la selección

    const btnAsignar = drawer.locator('button', { hasText: 'Asignar Revisor' });
    await btnAsignar.click();

    // Esperamos a que la red procese la petición y aparezca en la sección específica de "Revisores Asignados"
    await expect(drawer.locator('p', { hasText: 'Revisores Asignados' })).toBeVisible({ timeout: 10000 });
    const listaAsignados = drawer.locator('.v-list').filter({ hasText: 'revisor_pro' });
    await expect(listaAsignados).toBeVisible();
    await page.waitForTimeout(1000); // Pausa visual para ver que la tarjeta de asignado (con los 5 días) aparece

    // Cambiamos estado a "UNDER_REVIEW" (En revisión) y agregamos comentario
    const selectEstado = drawer.locator('.v-select', { hasText: 'RECEIVED' }).locator('input').first();
    await selectEstado.click({ force: true });

    const estadoEnRevision = page.locator('.v-list-item', { hasText: 'En revisión' }).first();
    await estadoEnRevision.click();

    // Llenamos el textarea de "Comentarios al Autor (opcional)"
    await drawer.locator('textarea').first().fill('Se ha asignado revisor a tu documento. Iniciamos la revisión formal.');
    await page.waitForTimeout(500); // Pausa visual

    const btnAplicar = drawer.locator('button', { hasText: /Aplicar Decisión/i });
    await btnAplicar.click();

    // Dejamos un momento visual
    await page.waitForTimeout(1000);
    await drawer.locator('button.v-btn--icon').first().click();

    // ----------------------------------------------------------------------
    // FASE 3: EL AUTOR VERIFICA (DOBLE CIEGO)
    // ----------------------------------------------------------------------
    // Cambiamos de sesión de vuelta al Autor en la MISMA página
    await page.evaluate((authData) => {
      localStorage.clear();
      localStorage.setItem('token', authData.token);
      localStorage.setItem('user', JSON.stringify(authData.user));
      localStorage.setItem('activeEvent', authData.activeEvent);
      localStorage.setItem('userEvents', authData.userEvents);
    }, autorUser);

    await page.goto('/author');

    // Verificamos que el estado haya cambiado a "En revisión"
    const authorCardUpdated = page.locator('.v-card', { hasText: uniqueTitle }).first();
    await expect(authorCardUpdated).toBeVisible();
    await expect(authorCardUpdated).toContainText(/En revisión/i);

    // El autor entra al detalle para ver los comentarios del editor
    const btnDetalle = authorCardUpdated.locator('button', { hasText: /Detalle/i });
    await btnDetalle.click();
    await page.waitForTimeout(1000); // Pausa visual para ver que se abre el detalle

    // Verificamos que el comentario del editor sea visible para el autor
    const comentarioEditor = page.locator('text=Se ha asignado revisor a tu documento. Iniciamos la revisión formal.');
    await expect(comentarioEditor).toBeVisible({ timeout: 10000 });

    // Hacemos scroll al comentario para que sea claramente visible en el video
    await comentarioEditor.scrollIntoViewIfNeeded();
    await page.waitForTimeout(800); // Pausa visual para que la cámara capture la decisión editorial

    // TEST CRÍTICO: Verificación de regla Doble Ciego
    const textoPaginaAutor = await page.locator('body').innerText();
    expect(textoPaginaAutor.toLowerCase()).not.toContain('revisor_pro');

    // Buffer visual final del video
    await page.waitForTimeout(3000);
  });
});