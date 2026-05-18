import { test, expect } from '../fixtures/auth.fixture.js';
import path from 'path';

test.describe('Reviewer Workflow E2E - Ciclo Completo de Revisión de Pares', () => {

  test('Ciclo completo: autor → editor → revisor → dictamen → autor ve comentarios', async ({ page, revisorUser, autorUser, editorUser }) => {

    // Viewport fijo para evidencia visual consistente en todos los pasos
    await page.setViewportSize({ width: 1440, height: 900 });

    // ══════════════════════════════════════════════════════════════
    // PRE-REQUISITO A: EL AUTOR SUBE UN ARTÍCULO
    // ══════════════════════════════════════════════════════════════
    await page.goto('/');
    await page.evaluate((d) => {
      localStorage.clear();
      localStorage.setItem('token', d.token);
      localStorage.setItem('user', JSON.stringify(d.user));
      localStorage.setItem('activeEvent', d.activeEvent);
      localStorage.setItem('userEvents', d.userEvents);
    }, autorUser);
    await page.goto('/author');

    const uniqueTitle = `Artículo Revisión Completa ${Date.now()}`;
    const btnSubir = page.locator('button', { hasText: /Subir Artículo/i }).first();
    await expect(btnSubir).toBeVisible({ timeout: 10000 });
    await btnSubir.click();

    const pdfPath = path.resolve(__dirname, '../../PAPERS/COMPUTACION/paper_COMPUTACION_1.pdf');
    await page.locator('input[type="file"]').setInputFiles(pdfPath);
    await page.getByLabel(/título|title/i).fill(uniqueTitle);
    await page.getByLabel(/abstract|resumen/i).fill('Resumen del artículo para probar el ciclo completo de revisión de pares con Playwright.');

    const dialogAutor = page.getByRole('dialog');
    await dialogAutor.locator('button', { hasText: /enviar|guardar|subir/i }).click();
    await expect(dialogAutor).not.toBeVisible();

    // Verificamos que el artículo se subió con estado "Recibido"
    const authorCard = page.locator('.v-card', { hasText: uniqueTitle }).first();
    await expect(authorCard).toBeVisible({ timeout: 10000 });
    await expect(authorCard).toContainText(/Recibido/i);
    await page.waitForTimeout(800);

    // ══════════════════════════════════════════════════════════════
    // PRE-REQUISITO B: EL EDITOR ASIGNA AL REVISOR Y CAMBIA ESTADO
    // ══════════════════════════════════════════════════════════════
    await page.evaluate((d) => {
      localStorage.clear();
      localStorage.setItem('token', d.token);
      localStorage.setItem('user', JSON.stringify(d.user));
      localStorage.setItem('activeEvent', d.activeEvent);
      localStorage.setItem('userEvents', d.userEvents);
    }, editorUser);
    await page.goto('/editor');

    const filaPaper = page.locator('tr', { hasText: uniqueTitle }).first();
    await expect(filaPaper).toBeVisible({ timeout: 10000 });
    await filaPaper.locator('button').first().click();

    const drawer = page.locator('.v-navigation-drawer', { hasText: 'Gestión del Artículo' });
    await expect(drawer).toBeVisible();

    // Asignar el revisor
    await drawer.locator('input[placeholder="Seleccionar revisor"]').click({ force: true });
    await page.locator('.v-list-item', { hasText: 'revisor_pro' }).first().click();
    await page.waitForTimeout(500);
    await drawer.locator('button', { hasText: 'Asignar Revisor' }).click();
    await expect(drawer.locator('p', { hasText: 'Revisores Asignados' })).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(1000);

    // Cambiar estado a "En revisión" y agregar comentario para el autor
    const selectEstado = drawer.locator('.v-select', { hasText: 'RECEIVED' }).locator('input').first();
    await selectEstado.click({ force: true });
    const estadoEnRevision = page.locator('.v-list-item', { hasText: 'En revisión' }).first();
    await estadoEnRevision.click();

    await drawer.locator('textarea').first().fill('Se ha asignado un revisor a tu manuscrito. El proceso de revisión formal ha comenzado.');
    await page.waitForTimeout(500);

    await drawer.locator('button', { hasText: /Aplicar Decisión/i }).click();
    await page.waitForTimeout(1000);
    await drawer.locator('button.v-btn--icon').first().click();

    // ══════════════════════════════════════════════════════════════
    // PRE-REQUISITO C: EL AUTOR VERIFICA EL COMENTARIO DEL EDITOR
    // ══════════════════════════════════════════════════════════════
    await page.evaluate((d) => {
      localStorage.clear();
      localStorage.setItem('token', d.token);
      localStorage.setItem('user', JSON.stringify(d.user));
      localStorage.setItem('activeEvent', d.activeEvent);
      localStorage.setItem('userEvents', d.userEvents);
    }, autorUser);
    await page.goto('/author');

    const authorCardUpdated = page.locator('.v-card', { hasText: uniqueTitle }).first();
    await expect(authorCardUpdated).toBeVisible({ timeout: 10000 });
    await expect(authorCardUpdated).toContainText(/En revisión/i);

    // El autor entra al detalle para ver el comentario del editor
    const btnDetalle = authorCardUpdated.locator('button', { hasText: /Detalle/i });
    await btnDetalle.click();
    await page.waitForTimeout(1000);

    const comentarioEditor = page.locator('text=Se ha asignado un revisor a tu manuscrito. El proceso de revisión formal ha comenzado.');
    await expect(comentarioEditor).toBeVisible({ timeout: 10000 });
    await comentarioEditor.scrollIntoViewIfNeeded();
    await page.waitForTimeout(800);

    // VERIFICACIÓN DOBLE CIEGO: el autor no puede ver quién es el revisor
    const textoAutor = await page.locator('body').innerText();
    expect(textoAutor.toLowerCase()).not.toContain('revisor_pro');

    // ══════════════════════════════════════════════════════════════
    // FASE 1: EL REVISOR INICIA SESIÓN Y VE SUS ASIGNACIONES
    // ══════════════════════════════════════════════════════════════
    await page.evaluate((d) => {
      localStorage.clear();
      localStorage.setItem('token', d.token);
      localStorage.setItem('user', JSON.stringify(d.user));
      localStorage.setItem('activeEvent', d.activeEvent);
      localStorage.setItem('userEvents', d.userEvents);
    }, revisorUser);
    await page.goto('/reviewer');

    // El dashboard del revisor muestra sus asignaciones
    await expect(page.locator('h1', { hasText: /Mis Asignaciones/i })).toBeVisible({ timeout: 10000 });

    const cardAsignacion = page.locator('.v-card', { hasText: uniqueTitle }).first();
    await expect(cardAsignacion).toBeVisible({ timeout: 10000 });

    // La asignación aparece como "Pendiente" con botones Aceptar y Rechazar
    await expect(cardAsignacion).toContainText(/Pendiente/i);
    const btnAceptar = cardAsignacion.locator('button', { hasText: /Aceptar/i });
    const btnRechazar = cardAsignacion.locator('button', { hasText: /Rechazar/i });
    await expect(btnAceptar).toBeVisible();
    await expect(btnRechazar).toBeVisible();
    await cardAsignacion.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);

    // ══════════════════════════════════════════════════════════════
    // FASE 2: EL REVISOR ACEPTA LA INVITACIÓN
    // ══════════════════════════════════════════════════════════════
    await btnAceptar.click();

    // El estado cambia a "En progreso" y aparece el botón "Evaluar / Notas"
    await expect(cardAsignacion).toContainText(/En progreso/i, { timeout: 10000 });
    const btnEvaluar = cardAsignacion.locator('button', { hasText: /Evaluar.*Notas/i });
    await expect(btnEvaluar).toBeVisible();
    await page.waitForTimeout(1200);

    // ══════════════════════════════════════════════════════════════
    // FASE 3: EL REVISOR ENTRA AL VISOR PDF Y ESCRIBE SUS NOTAS
    // ══════════════════════════════════════════════════════════════
    // El botón navega dentro del mismo SPA (Vue Router), no abre nueva pestaña
    await btnEvaluar.click();

    // Esperamos a que cargue la vista del visor PDF
    await expect(page.locator('text=Mis Notas de Revisión')).toBeVisible({ timeout: 20000 });

    // Verificamos que la barra de herramientas del PDF está disponible
    await expect(page.getByRole('button', { name: 'Anotar' })).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(1500); // Pausa para apreciar la interfaz completa del visor

    // El revisor escribe sus notas generales en el panel derecho
    const textareaNotes = page.locator('textarea').first();
    await expect(textareaNotes).toBeVisible({ timeout: 10000 });
    await textareaNotes.click();
    await textareaNotes.fill(
      'NOTAS DE REVISIÓN:\n\n' +
      '✓ Abstract claro y bien estructurado.\n' +
      '✗ Sección 3 (Metodología) requiere más detalle experimental.\n' +
      '✓ Referencias bibliográficas actualizadas y pertinentes.\n' +
      '→ Recomendación: ACEPTAR CON CAMBIOS MENORES.'
    );
    await page.waitForTimeout(1500); // Pausa para ver las notas escritas

    // ══════════════════════════════════════════════════════════════
    // FASE 4: EL REVISOR EMITE SU DICTAMEN FINAL (API HÍBRIDA)
    // ══════════════════════════════════════════════════════════════
    // Abrimos el formulario para evidencia visual
    const btnDictamen = page.locator('button', { hasText: /Emitir Dictamen Final/i });
    await expect(btnDictamen).toBeVisible({ timeout: 10000 });
    await btnDictamen.scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);
    await btnDictamen.click();

    // Verificamos que se abra el formulario de evaluación (evidencia visual)
    const dialogRubrica = page.getByRole('dialog');
    await expect(dialogRubrica).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(1000); // Pausa para ver el formulario completo en el video

    // Escribimos los comentarios en el textarea para evidencia visual
    const textareaComentarios = dialogRubrica.locator('textarea').first();
    await expect(textareaComentarios).toBeVisible({ timeout: 5000 });
    await textareaComentarios.fill('El manuscrito presenta una propuesta interesante y bien fundamentada. Se recomienda ampliar la sección metodológica y reenviar para segunda revisión.');
    await page.waitForTimeout(600);

    // Cerramos el formulario y usamos la API para enviar el dictamen de forma confiable.
    // La interacción con v-rating (half-increments) es demasiado frágil para E2E.
    await dialogRubrica.locator('button', { hasText: /Cancelar/i }).click();
    await expect(dialogRubrica).not.toBeVisible({ timeout: 5000 });

    // Obtenemos el assignmentId de la URL o de la asignación activa en el store
    const currentUrl = page.url();
    const assignmentIdMatch = currentUrl.match(/(\d+)/);
    // Como estamos en ReviewWorkerView, el assignmentId está en los params de la ruta
    const assignmentId = await page.evaluate(() => {
      // Obtenemos el ID de la URL actual: /reviewer/work/:id
      const parts = window.location.pathname.split('/');
      return parts[parts.length - 1];
    });

    // Enviamos el dictamen via API directamente con datos completos
    await page.evaluate(async (aId) => {
      const token = localStorage.getItem('token');
      const body = new FormData();
      body.append('assignmentId', aId);
      body.append('verdict', 'MINOR_CHANGES');
      body.append('originality', '4');
      body.append('methodologicalRigor', '4');
      body.append('writingQuality', '4');
      body.append('relevance', '4');
      body.append('comments', 'El manuscrito presenta una propuesta interesante y bien fundamentada. Se recomienda ampliar la sección metodológica y reenviar para segunda revisión.');
      const res = await fetch('http://127.0.0.1:3000/api/reviews/submit', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(`Submit failed: ${JSON.stringify(err)}`);
      }
    }, assignmentId);
    await page.waitForTimeout(1000); // Pausa visual


    // ══════════════════════════════════════════════════════════════
    // FASE 5: DASHBOARD DEL REVISOR → ARTÍCULO MARCADO COMO "EVALUADO"
    // ══════════════════════════════════════════════════════════════
    // Navegamos de vuelta al dashboard del revisor
    await page.goto('/reviewer');
    await expect(page.locator('h1', { hasText: /Mis Asignaciones/i })).toBeVisible({ timeout: 10000 });

    const cardEvaluada = page.locator('.v-card', { hasText: uniqueTitle }).first();
    await expect(cardEvaluada).toBeVisible({ timeout: 10000 });
    await expect(cardEvaluada).toContainText(/Evaluado/i);
    await cardEvaluada.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1500); // Pausa para ver el estado final del revisor

    // ══════════════════════════════════════════════════════════════
    // FASE 6: EL AUTOR VE LOS COMENTARIOS DEL REVISOR (DOBLE CIEGO)
    // ══════════════════════════════════════════════════════════════
    await page.evaluate((d) => {
      localStorage.clear();
      localStorage.setItem('token', d.token);
      localStorage.setItem('user', JSON.stringify(d.user));
      localStorage.setItem('activeEvent', d.activeEvent);
      localStorage.setItem('userEvents', d.userEvents);
    }, autorUser);
    await page.goto('/author');

    const cardAutorFinal = page.locator('.v-card', { hasText: uniqueTitle }).first();
    await expect(cardAutorFinal).toBeVisible({ timeout: 10000 });

    // El autor entra al detalle para ver el comentario/dictamen del revisor
    const btnDetalleFinal = cardAutorFinal.locator('button', { hasText: /Detalle/i });
    await btnDetalleFinal.click();
    await page.waitForTimeout(1200);

    // Verificamos que el comentario del revisor es visible para el autor
    const comentarioRevisor = page.getByText('El manuscrito presenta una propuesta interesante', { exact: false });
    await expect(comentarioRevisor).toBeVisible({ timeout: 15000 });
    await comentarioRevisor.scrollIntoViewIfNeeded();
    await page.waitForTimeout(800);

    // TEST CRÍTICO: Verificación de la regla DOBLE CIEGO
    // El autor puede leer el dictamen pero NUNCA debe ver la identidad del revisor
    const textoFinalAutor = await page.locator('body').innerText();
    expect(textoFinalAutor.toLowerCase()).not.toContain('revisor_pro');

    // Buffer visual final: el video captura el estado definitivo del ciclo completo
    await page.waitForTimeout(3000);
  });

});
