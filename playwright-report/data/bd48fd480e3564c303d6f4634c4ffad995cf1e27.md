# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e\reviewer-workflow.spec.js >> Reviewer Workflow E2E - Ciclo Completo de Revisión de Pares >> Ciclo completo: autor → editor → revisor → dictamen → autor ve comentarios
- Location: tests\e2e\reviewer-workflow.spec.js:6:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=El manuscrito presenta una propuesta interesante.')
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for locator('text=El manuscrito presenta una propuesta interesante.')

```

```yaml
- banner:
  - button
  - text: Congreso Activo Congreso de INGENIERIA
  - button
  - text: Autor
  - button
  - button "A autor_pro Cuenta Activa"
- navigation:
  - list:
    - listitem: StudioPeer Review System
  - separator
  - list:
    - text: Funcionalidades
    - link "Mis Artículos":
      - /url: /author
  - list:
    - listitem: Desanclar Panel
    - listitem: Configuración
- main:
  - button
  - heading "Detalle del Artículo" [level=1]
  - text: En revisión Artículo Revisión Completa 1779059636699
  - paragraph: Resumen del artículo para probar el ciclo completo de revisión de pares con Playwright.
  - button "Ver Documento Original"
  - heading "Evaluaciones Recibidas" [level=2]
  - text: Cambios Menores Revisor 1 17 may 2026
  - paragraph: Originalidad
  - text: Rating 0 of 5
  - radio "Rating 0 of 5"
  - text: Rating 0.5 of 5
  - button "Rating 0.5 of 5"
  - radio "Rating 0.5 of 5 Rating 0.5 of 5"
  - text: Rating 1 of 5
  - button "Rating 1 of 5"
  - radio "Rating 1 of 5 Rating 1 of 5"
  - text: Rating 1.5 of 5
  - button "Rating 1.5 of 5"
  - radio "Rating 1.5 of 5 Rating 1.5 of 5"
  - text: Rating 2 of 5
  - button "Rating 2 of 5"
  - radio "Rating 2 of 5 Rating 2 of 5" [checked]
  - text: Rating 2.5 of 5
  - button "Rating 2.5 of 5"
  - radio "Rating 2.5 of 5 Rating 2.5 of 5"
  - text: Rating 3 of 5
  - button "Rating 3 of 5"
  - radio "Rating 3 of 5 Rating 3 of 5"
  - text: Rating 3.5 of 5
  - button "Rating 3.5 of 5"
  - radio "Rating 3.5 of 5 Rating 3.5 of 5"
  - text: Rating 4 of 5
  - button "Rating 4 of 5"
  - radio "Rating 4 of 5 Rating 4 of 5"
  - text: Rating 4.5 of 5
  - button "Rating 4.5 of 5"
  - radio "Rating 4.5 of 5 Rating 4.5 of 5"
  - text: Rating 5 of 5
  - button "Rating 5 of 5"
  - radio "Rating 5 of 5 Rating 5 of 5"
  - paragraph: Rigor Metod.
  - text: Rating 0 of 5
  - radio "Rating 0 of 5"
  - text: Rating 0.5 of 5
  - button "Rating 0.5 of 5"
  - radio "Rating 0.5 of 5 Rating 0.5 of 5"
  - text: Rating 1 of 5
  - button "Rating 1 of 5"
  - radio "Rating 1 of 5 Rating 1 of 5"
  - text: Rating 1.5 of 5
  - button "Rating 1.5 of 5"
  - radio "Rating 1.5 of 5 Rating 1.5 of 5"
  - text: Rating 2 of 5
  - button "Rating 2 of 5"
  - radio "Rating 2 of 5 Rating 2 of 5" [checked]
  - text: Rating 2.5 of 5
  - button "Rating 2.5 of 5"
  - radio "Rating 2.5 of 5 Rating 2.5 of 5"
  - text: Rating 3 of 5
  - button "Rating 3 of 5"
  - radio "Rating 3 of 5 Rating 3 of 5"
  - text: Rating 3.5 of 5
  - button "Rating 3.5 of 5"
  - radio "Rating 3.5 of 5 Rating 3.5 of 5"
  - text: Rating 4 of 5
  - button "Rating 4 of 5"
  - radio "Rating 4 of 5 Rating 4 of 5"
  - text: Rating 4.5 of 5
  - button "Rating 4.5 of 5"
  - radio "Rating 4.5 of 5 Rating 4.5 of 5"
  - text: Rating 5 of 5
  - button "Rating 5 of 5"
  - radio "Rating 5 of 5 Rating 5 of 5"
  - paragraph: Redacción
  - text: Rating 0 of 5
  - radio "Rating 0 of 5"
  - text: Rating 0.5 of 5
  - button "Rating 0.5 of 5"
  - radio "Rating 0.5 of 5 Rating 0.5 of 5"
  - text: Rating 1 of 5
  - button "Rating 1 of 5"
  - radio "Rating 1 of 5 Rating 1 of 5"
  - text: Rating 1.5 of 5
  - button "Rating 1.5 of 5"
  - radio "Rating 1.5 of 5 Rating 1.5 of 5"
  - text: Rating 2 of 5
  - button "Rating 2 of 5"
  - radio "Rating 2 of 5 Rating 2 of 5" [checked]
  - text: Rating 2.5 of 5
  - button "Rating 2.5 of 5"
  - radio "Rating 2.5 of 5 Rating 2.5 of 5"
  - text: Rating 3 of 5
  - button "Rating 3 of 5"
  - radio "Rating 3 of 5 Rating 3 of 5"
  - text: Rating 3.5 of 5
  - button "Rating 3.5 of 5"
  - radio "Rating 3.5 of 5 Rating 3.5 of 5"
  - text: Rating 4 of 5
  - button "Rating 4 of 5"
  - radio "Rating 4 of 5 Rating 4 of 5"
  - text: Rating 4.5 of 5
  - button "Rating 4.5 of 5"
  - radio "Rating 4.5 of 5 Rating 4.5 of 5"
  - text: Rating 5 of 5
  - button "Rating 5 of 5"
  - radio "Rating 5 of 5 Rating 5 of 5"
  - paragraph: Relevancia
  - text: Rating 0 of 5
  - radio "Rating 0 of 5"
  - text: Rating 0.5 of 5
  - button "Rating 0.5 of 5"
  - radio "Rating 0.5 of 5 Rating 0.5 of 5"
  - text: Rating 1 of 5
  - button "Rating 1 of 5"
  - radio "Rating 1 of 5 Rating 1 of 5"
  - text: Rating 1.5 of 5
  - button "Rating 1.5 of 5"
  - radio "Rating 1.5 of 5 Rating 1.5 of 5"
  - text: Rating 2 of 5
  - button "Rating 2 of 5"
  - radio "Rating 2 of 5 Rating 2 of 5" [checked]
  - text: Rating 2.5 of 5
  - button "Rating 2.5 of 5"
  - radio "Rating 2.5 of 5 Rating 2.5 of 5"
  - text: Rating 3 of 5
  - button "Rating 3 of 5"
  - radio "Rating 3 of 5 Rating 3 of 5"
  - text: Rating 3.5 of 5
  - button "Rating 3.5 of 5"
  - radio "Rating 3.5 of 5 Rating 3.5 of 5"
  - text: Rating 4 of 5
  - button "Rating 4 of 5"
  - radio "Rating 4 of 5 Rating 4 of 5"
  - text: Rating 4.5 of 5
  - button "Rating 4.5 of 5"
  - radio "Rating 4.5 of 5 Rating 4.5 of 5"
  - text: Rating 5 of 5
  - button "Rating 5 of 5"
  - radio "Rating 5 of 5 Rating 5 of 5"
  - separator
  - paragraph: El manuscrito presenta una propuesta interesante y bien fundamentada. Se recomienda ampliar la sección metodológica y reenviar para segunda revisión.
  - button "Ver correcciones"
  - button "Descargar"
  - heading "Historial del Artículo" [level=2]
  - strong: Manuscrito recibido
  - text: 17/5/2026, 4:14:00 p.m.
  - paragraph: Versión 1 subida por el autor.
  - strong: "Decisión editorial: UNDER_REVIEW"
  - text: 17/5/2026, 4:14:09 p.m.
  - paragraph: "Editor: Se ha asignado un revisor a tu manuscrito. El proceso de revisión formal ha comenzado."
  - strong: Revisión aceptada
  - text: 17/5/2026, 4:14:18 p.m.
  - paragraph: El revisor ha aceptado la invitación.
  - strong: Dictamen emitido
  - text: 17/5/2026, 4:14:38 p.m.
  - paragraph: "Un revisor finalizó su evaluación: MINOR_CHANGES."
  - separator
  - paragraph: Añadir Comentario
  - textbox "Escribe un comentario..."
  - button "Enviar" [disabled]
- tooltip
- tooltip
- tooltip
```

# Test source

```ts
  174 |       '→ Recomendación: ACEPTAR CON CAMBIOS MENORES.'
  175 |     );
  176 |     await page.waitForTimeout(1500); // Pausa para ver las notas escritas
  177 | 
  178 |     // ══════════════════════════════════════════════════════════════
  179 |     // FASE 4: EL REVISOR EMITE SU DICTAMEN FINAL (RÚBRICA)
  180 |     // ══════════════════════════════════════════════════════════════
  181 |     const btnDictamen = page.locator('button', { hasText: /Emitir Dictamen Final/i });
  182 |     await expect(btnDictamen).toBeVisible({ timeout: 10000 });
  183 |     await btnDictamen.scrollIntoViewIfNeeded();
  184 |     await page.waitForTimeout(600);
  185 |     await btnDictamen.click();
  186 | 
  187 |     // Se abre el formulario de evaluación (rúbrica)
  188 |     const dialogRubrica = page.getByRole('dialog');
  189 |     await expect(dialogRubrica).toBeVisible({ timeout: 10000 });
  190 |     await page.waitForTimeout(800); // Pausa para ver el formulario completo
  191 | 
  192 |     // ─── PASO 4.1: Calificamos con estrellas cada criterio (4/5 = Bueno) ───
  193 |     // Originalidad · Rigor Metodológico · Calidad de Redacción · Relevancia
  194 |     // Usamos force:true porque los botones de Vuetify v-rating dentro del dialog
  195 |     // pueden ser interceptados por el overlay
  196 |     const starGroups = dialogRubrica.locator('.v-rating');
  197 |     const numGroups = await starGroups.count();
  198 |     if (numGroups > 0) {
  199 |       for (let i = 0; i < numGroups; i++) {
  200 |         // Click en la 4ª estrella (índice 3) de cada criterio
  201 |         const star4 = starGroups.nth(i).locator('button').nth(3);
  202 |         await star4.click({ force: true });
  203 |         await page.waitForTimeout(400);
  204 |       }
  205 |     } else {
  206 |       // Fallback: buscar botones de estrella por ícono de Vuetify
  207 |       const allStarBtns = dialogRubrica.locator('[class*="rating"] button, .v-rating__item button');
  208 |       const totalStars = await allStarBtns.count();
  209 |       // 4 criterios × 5 estrellas = 20 botones; click en la 4ª de cada grupo
  210 |       for (let i = 3; i < totalStars; i += 5) {
  211 |         await allStarBtns.nth(i).click({ force: true });
  212 |         await page.waitForTimeout(400);
  213 |       }
  214 |     }
  215 |     await page.waitForTimeout(600);
  216 | 
  217 |     // ─── PASO 4.2: Seleccionamos el veredicto "M. MENORES" ───────────────
  218 |     // Los botones de veredicto en la UI dicen: ACEPTAR | M. MENORES | M. MAYORES | RECHAZAR
  219 |     const btnVeredicto = dialogRubrica.locator('button', { hasText: /M\.\s*MENORES/i });
  220 |     await expect(btnVeredicto).toBeVisible({ timeout: 5000 });
  221 |     await btnVeredicto.click();
  222 |     await page.waitForTimeout(600); // Pausa visual para ver el veredicto seleccionado
  223 | 
  224 |     // ─── PASO 4.3: Escribimos el comentario final (mínimo 20 caracteres) ─
  225 |     const textareaComentarios = dialogRubrica.locator('textarea').first();
  226 |     await expect(textareaComentarios).toBeVisible({ timeout: 5000 });
  227 |     await textareaComentarios.fill('El manuscrito presenta una propuesta interesante y bien fundamentada. Se recomienda ampliar la sección metodológica y reenviar para segunda revisión.');
  228 |     await page.waitForTimeout(800); // Pausa para ver el comentario escrito
  229 | 
  230 |     // ─── PASO 4.4: Enviamos la evaluación ────────────────────────────────
  231 |     // El botón dice "ENVIAR EVALUACIÓN" (mayúsculas en la UI)
  232 |     const btnEnviarEvaluacion = dialogRubrica.locator('button', { hasText: /ENVIAR EVALUACI[ÓO]N/i });
  233 |     await expect(btnEnviarEvaluacion).toBeEnabled({ timeout: 5000 });
  234 |     await btnEnviarEvaluacion.scrollIntoViewIfNeeded();
  235 |     await page.waitForTimeout(500);
  236 |     await btnEnviarEvaluacion.click();
  237 |     await page.waitForTimeout(2000); // Pausa para ver el envío procesarse
  238 | 
  239 |     // ══════════════════════════════════════════════════════════════
  240 |     // FASE 5: DASHBOARD DEL REVISOR → ARTÍCULO MARCADO COMO "EVALUADO"
  241 |     // ══════════════════════════════════════════════════════════════
  242 |     // Navegamos de vuelta al dashboard del revisor
  243 |     await page.goto('/reviewer');
  244 |     await expect(page.locator('h1', { hasText: /Mis Asignaciones/i })).toBeVisible({ timeout: 10000 });
  245 | 
  246 |     const cardEvaluada = page.locator('.v-card', { hasText: uniqueTitle }).first();
  247 |     await expect(cardEvaluada).toBeVisible({ timeout: 10000 });
  248 |     await expect(cardEvaluada).toContainText(/Evaluado/i);
  249 |     await cardEvaluada.scrollIntoViewIfNeeded();
  250 |     await page.waitForTimeout(1500); // Pausa para ver el estado final del revisor
  251 | 
  252 |     // ══════════════════════════════════════════════════════════════
  253 |     // FASE 6: EL AUTOR VE LOS COMENTARIOS DEL REVISOR (DOBLE CIEGO)
  254 |     // ══════════════════════════════════════════════════════════════
  255 |     await page.evaluate((d) => {
  256 |       localStorage.clear();
  257 |       localStorage.setItem('token', d.token);
  258 |       localStorage.setItem('user', JSON.stringify(d.user));
  259 |       localStorage.setItem('activeEvent', d.activeEvent);
  260 |       localStorage.setItem('userEvents', d.userEvents);
  261 |     }, autorUser);
  262 |     await page.goto('/author');
  263 | 
  264 |     const cardAutorFinal = page.locator('.v-card', { hasText: uniqueTitle }).first();
  265 |     await expect(cardAutorFinal).toBeVisible({ timeout: 10000 });
  266 | 
  267 |     // El autor entra al detalle para ver el comentario/dictamen del revisor
  268 |     const btnDetalleFinal = cardAutorFinal.locator('button', { hasText: /Detalle/i });
  269 |     await btnDetalleFinal.click();
  270 |     await page.waitForTimeout(1200);
  271 | 
  272 |     // Verificamos que el comentario del revisor es visible para el autor
  273 |     const comentarioRevisor = page.locator('text=El manuscrito presenta una propuesta interesante.');
> 274 |     await expect(comentarioRevisor).toBeVisible({ timeout: 10000 });
      |                                     ^ Error: expect(locator).toBeVisible() failed
  275 |     await comentarioRevisor.scrollIntoViewIfNeeded();
  276 |     await page.waitForTimeout(800);
  277 | 
  278 |     // TEST CRÍTICO: Verificación de la regla DOBLE CIEGO
  279 |     // El autor puede leer el dictamen pero NUNCA debe ver la identidad del revisor
  280 |     const textoFinalAutor = await page.locator('body').innerText();
  281 |     expect(textoFinalAutor.toLowerCase()).not.toContain('revisor_pro');
  282 | 
  283 |     // Buffer visual final: el video captura el estado definitivo del ciclo completo
  284 |     await page.waitForTimeout(3000);
  285 |   });
  286 | 
  287 | });
  288 | 
```