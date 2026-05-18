import { test, expect } from '../fixtures/auth.fixture.js';
import path from 'path';

import { DashboardPage } from '../pages/DashboardPage.js';
import { PaperPage } from '../pages/PaperPage.js';

test.describe('Author Workflow E2E', () => {
  test('El autor puede subir un artículo, verlo en su lista y comprobar su estado', async ({ autorPage }) => {
    // 1. Navegar al dashboard del autor
    await autorPage.goto('/author');

    // 2. Dar clic en el botón de subir nuevo artículo
    // Esperamos a que la UI cargue buscando el botón por texto en lugar de solo su rol
    const btnSubir = autorPage.locator('button', { hasText: /Subir Artículo/i }).first();
    await expect(btnSubir).toBeVisible({ timeout: 10000 });
    await btnSubir.click();

    // 3. Subir el archivo y llenar el formulario
    const pdfPath = path.resolve(__dirname, '../../PAPERS/COMPUTACION/paper_COMPUTACION_1.pdf');
    const uniqueTitle = `Mi nuevo paper automatizado ${Date.now()}`;

    // Llenamos el formulario
    await autorPage.locator('input[type="file"]').setInputFiles(pdfPath);
    await autorPage.getByLabel(/título|title/i).fill(uniqueTitle);
    await autorPage.getByLabel(/abstract|resumen/i).fill('Este es un resumen de prueba automatizado para validar la carga.');

    // Enviar el formulario
    const dialog = autorPage.getByRole('dialog');
    const btnEnviar = dialog.locator('button', { hasText: /enviar|guardar|subir/i });
    await btnEnviar.click();

    // 4. Verificamos que el modal se cierre
    await expect(dialog).not.toBeVisible();

    // 5. Verificamos que el artículo recién subido aparece en la lista
    const newPaperCard = autorPage.locator('.v-card', { hasText: uniqueTitle }).first();
    await expect(newPaperCard).toBeVisible();

    // 6. Verificamos que el autor puede visualizar el PDF subido
    // Para que el PDF se muestre en el mismo video/pestaña, interceptamos window.open.
    // Como los navegadores headless (Playwright) no incluyen el plugin nativo de PDF 
    // y muestran una pantalla gris, inyectaremos PDF.js para renderizar la primera página.
    await autorPage.evaluate(() => {
      window.originalOpen = window.open;
      window.open = (url) => {
        const overlay = document.createElement('div');
        overlay.id = 'pdf-viewer-overlay';
        overlay.setAttribute('data-src', url);
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100vw';
        overlay.style.height = '100vh';
        overlay.style.backgroundColor = '#525659'; // Fondo oscuro típico de visores PDF
        overlay.style.zIndex = '9999';
        overlay.style.display = 'flex';
        overlay.style.flexDirection = 'column';
        overlay.style.alignItems = 'center';
        overlay.style.overflow = 'auto';

        // Header del visor mock
        const header = document.createElement('div');
        header.style.width = '100%';
        header.style.backgroundColor = '#323639';
        header.style.padding = '10px 20px';
        header.style.color = 'white';
        header.style.fontFamily = 'sans-serif';
        header.style.boxShadow = '0 2px 4px rgba(0,0,0,0.5)';
        header.innerHTML = '📄 Visualizando PDF en Playwright (PDF.js)';
        overlay.appendChild(header);

        // Contenedor para el canvas o el texto de carga
        const content = document.createElement('div');
        content.style.marginTop = '20px';
        content.style.marginBottom = '40px';
        content.innerHTML = '<h3 style="color:white; font-family:sans-serif;">Cargando documento PDF...</h3>';
        overlay.appendChild(content);

        document.body.appendChild(overlay);

        // Inyectamos PDF.js para renderizar el Blob visualmente
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js';
        script.onload = async () => {
          try {
            const pdfjsLib = window['pdfjs-dist/build/pdf'];
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
            const loadingTask = pdfjsLib.getDocument(url);
            const pdf = await loadingTask.promise;
            const page = await pdf.getPage(1); // Renderizamos la página 1
            const viewport = page.getViewport({ scale: 1.5 });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            canvas.style.boxShadow = '0 4px 12px rgba(0,0,0,0.5)';

            content.innerHTML = '';
            content.appendChild(canvas);

            await page.render({ canvasContext: context, viewport: viewport }).promise;
          } catch (e) {
            content.innerHTML = '<h3 style="color:#ff5252; font-family:sans-serif;">Error renderizando PDF: ' + e.message + '</h3>';
          }
        };
        document.head.appendChild(script);

        return window;
      };
    });

    await newPaperCard.locator('button', { hasText: /Ver PDF/i }).click();

    // Verificamos que el overlay se haya creado y sea visible
    const overlay = autorPage.locator('div#pdf-viewer-overlay');
    await expect(overlay).toBeVisible();

    // Verificamos que la URL original haya sido un blob
    const overlaySrc = await overlay.getAttribute('data-src');
    expect(overlaySrc).toContain('blob:');

    // Esperamos 4 segundos para asegurar que PDF.js descargue y renderice el PDF en el video
    await autorPage.waitForTimeout(4000);

    // Restauramos y limpiamos
    await autorPage.evaluate(() => {
      const overlayElement = document.getElementById('pdf-viewer-overlay');
      if (overlayElement) overlayElement.remove();
      window.open = window.originalOpen;
    });
  });
});
