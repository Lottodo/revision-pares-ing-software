import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage.js';

test.describe('Admin Workflow - Eventos, Invitaciones y Solicitudes', () => {

  const timestamp = Date.now();
  const privateEventName = `Congreso Privado ${timestamp}`;
  const privateEventSlug = `privado-${timestamp}`;
  const publicEventName = `Congreso Público ${timestamp}`;
  const publicEventSlug = `publico-${timestamp}`;

  test('Flujo 1: Admin crea evento privado e invita a revisor', async ({ browser }, testInfo) => {
    const videoDir = { recordVideo: { dir: 'test-results/', size: { width: 1280, height: 900 } } };
    const adminContext = await browser.newContext({ viewport: { width: 1280, height: 900 }, ...videoDir });
    const adminPage = await adminContext.newPage();
    const loginPage = new LoginPage(adminPage);

    // 1. Admin inicia sesión
    await adminPage.goto('/login');
    await loginPage.login('admin_root', '1234');
    
    // El admin global es redirigido directamente al panel /admin
    await expect(adminPage).toHaveURL(/\/admin/);
    
    // 2. Ir a la pestaña Eventos y crear un evento privado
    await adminPage.getByRole('tab', { name: 'Eventos' }).click();
    await adminPage.getByRole('button', { name: 'Nuevo Evento' }).click();
    
    await adminPage.getByLabel('Nombre del evento *').fill(privateEventName);
    await adminPage.getByLabel('Slug (identificador URL) *').fill(privateEventSlug);
    // Desmarcar Congreso Público (por defecto está marcado)
    await adminPage.getByLabel('Congreso Público').uncheck({ force: true });
    await adminPage.getByRole('button', { name: 'Crear evento' }).click();

    // Validar que el evento fue creado
    await expect(adminPage.getByText(privateEventName)).toBeVisible({ timeout: 10000 });

    // 3. Admin envía una invitación
    // Encontrar la tarjeta del evento creado y hacer clic en "Invitar"
    const eventCard = adminPage.locator('.v-card').filter({ hasText: privateEventName });
    await eventCard.getByRole('button', { name: 'Invitar' }).click();

    // Invitar a "revisor_pro" como REVIEWER
    await adminPage.getByLabel('Correo electrónico o Username').fill('revisor_pro');
    // El rol por defecto es REVIEWER, así que no necesitamos hacer clic en el select

    // Esperar mensaje de éxito
    adminPage.once('dialog', dialog => dialog.accept()); // Por el alert() del front
    await adminPage.getByRole('button', { name: 'Enviar Invitación' }).click();
    await adminPage.waitForTimeout(1500); // Para que se vea en el video

    const adminVideoPath = adminPage.video() ? await adminPage.video().path() : null;
    await adminContext.close();
    if (adminVideoPath) {
      await testInfo.attach('Video Admin (Creación e Invitación)', {
        path: adminVideoPath,
        contentType: 'video/webm'
      });
    }

    // 4. Revisor inicia sesión y acepta la invitación
    const revisorContext = await browser.newContext({ viewport: { width: 1280, height: 900 }, ...videoDir });
    const revisorPage = await revisorContext.newPage();
    const revisorLogin = new LoginPage(revisorPage);

    await revisorPage.goto('/login');
    await revisorLogin.login('revisor_pro', '1234');

    // Debe ver la invitación en el Event Selector
    await expect(revisorPage).toHaveURL(/\/select-event/);
    await expect(revisorPage.getByText('Tienes Invitaciones Pendientes')).toBeVisible();
    await expect(revisorPage.getByText(privateEventName)).toBeVisible();
    await revisorPage.waitForTimeout(1500); // Para que se vea en el video la invitación

    // Aceptar la invitación
    revisorPage.once('dialog', dialog => dialog.accept());
    await revisorPage.getByRole('button', { name: 'Aceptar' }).click();
    await revisorPage.waitForTimeout(1000);

    // Validar que ahora aparece en "Tus Congresos Inscritos"
    await expect(revisorPage.getByRole('heading', { name: 'Tus Congresos Inscritos' })).toBeVisible();
    await expect(revisorPage.getByText(privateEventName).last()).toBeVisible();

    const revisorVideoPath = revisorPage.video() ? await revisorPage.video().path() : null;
    await revisorContext.close();
    if (revisorVideoPath) {
      await testInfo.attach('Video Revisor (Aceptación de Invitación)', {
        path: revisorVideoPath,
        contentType: 'video/webm'
      });
    }
  });

  test('Flujo 2: Usuario se une por código y solicita ser autor', async ({ browser }, testInfo) => {
    const videoDir = { recordVideo: { dir: 'test-results/', size: { width: 1280, height: 900 } } };
    // 1. Admin crea evento público con código de acceso
    const adminContext = await browser.newContext({ viewport: { width: 1280, height: 900 }, ...videoDir });
    const adminPage = await adminContext.newPage();
    const loginPage = new LoginPage(adminPage);

    await adminPage.goto('/login');
    await loginPage.login('admin_root', '1234');
    await expect(adminPage).toHaveURL(/\/admin/);
    
    await adminPage.getByRole('tab', { name: 'Eventos' }).click();
    await adminPage.getByRole('button', { name: 'Nuevo Evento' }).click();
    
    await adminPage.getByLabel('Nombre del evento *').fill(publicEventName);
    await adminPage.getByLabel('Slug (identificador URL) *').fill(publicEventSlug);
    // Dejarlo como público (por defecto)
    await adminPage.getByLabel('Código de Acceso Privado').fill(`UABC-${timestamp}`);
    await adminPage.getByRole('button', { name: 'Crear evento' }).click();

    await expect(adminPage.getByText(publicEventName)).toBeVisible({ timeout: 10000 });

    // 2. Nuevo usuario o usuario existente ingresa el código
    const userContext = await browser.newContext({ viewport: { width: 1280, height: 900 }, ...videoDir });
    const userPage = await userContext.newPage();
    const userLogin = new LoginPage(userPage);

    await userPage.goto('/login');
    // Usamos el autor_pro
    await userLogin.login('autor_pro', '1234');
    await expect(userPage).toHaveURL(/\/select-event/);

    // Ingresar el código en el selector de eventos
    userPage.once('dialog', dialog => dialog.accept()); // Aceptar alert de unirse exitosamente
    await userPage.getByPlaceholder('Código de Invitación...').fill(`UABC-${timestamp}`);
    await userPage.waitForTimeout(1000);
    await userPage.getByRole('button', { name: 'Unirse' }).click();
    await userPage.waitForTimeout(1000);

    // Al unirse exitosamente, la tarjeta del congreso debe aparecer. Le damos click
    await userPage.getByText(publicEventName).click();

    // Como es ATTENDEE, debe ser redirigido a /attendee
    await expect(userPage).toHaveURL(/\/attendee/);
    await expect(userPage.getByText('Eres un Asistente')).toBeVisible();

    // 3. Usuario solicita ser Autor
    await userPage.getByRole('button', { name: 'Solicitar ser Autor' }).click();
    await userPage.getByLabel('Mensaje para el comité').fill('Quiero enviar mi artículo sobre IA.');
    await userPage.getByRole('button', { name: 'Enviar Solicitud' }).click();

    // Validar que el botón cambia de estado
    await expect(userPage.getByRole('button', { name: 'Solicitud en revisión...' })).toBeVisible();

    // 4. Admin aprueba la solicitud
    await adminPage.bringToFront();
    await adminPage.reload(); // Asegurar que carga la nueva info
    await adminPage.waitForTimeout(1000);

    // Volver a la pestaña Eventos (el reload la resetea a Usuarios)
    await adminPage.getByRole('tab', { name: 'Eventos' }).click();
    await adminPage.waitForTimeout(500);
    
    // Encontrar la tarjeta del evento público y hacer clic en "Solicitudes"
    const publicEventCard = adminPage.locator('.v-card').filter({ hasText: publicEventName }).first();
    await expect(publicEventCard).toBeVisible({ timeout: 10000 });
    await publicEventCard.getByRole('button', { name: 'Solicitudes' }).click();
    await adminPage.waitForTimeout(1500); // Mostrar solicitudes pendientes en video

    // Ver que la solicitud de autor_pro está pendiente
    const dialog = adminPage.getByRole('dialog');
    await expect(dialog.getByText('autor_pro')).toBeVisible();
    await expect(dialog.getByText('PENDING')).toBeVisible();

    // Aprobar
    await dialog.getByRole('button', { name: 'Aprobar' }).click();
    // Validar que cambió a APPROVED
    await expect(dialog.getByText('APPROVED')).toBeVisible();
    await adminPage.waitForTimeout(1500); // Mostrar en video la aprobación

    // 5. Usuario verifica que ya es autor
    // No basta con reload() porque el JWT en localStorage aún tiene rol ATTENDEE.
    // Debemos ir a /select-event y re-seleccionar el evento para que switchEvent()
    // obtenga un nuevo JWT con el rol AUTHOR aprobado por el admin.
    await userPage.bringToFront();
    await userPage.goto('/select-event');
    await userPage.waitForTimeout(1000);

    // Hacer click en la tarjeta del congreso público para disparar switchEvent
    await userPage.getByText(publicEventName).click();
    await userPage.waitForTimeout(1500);

    // Como ya es AUTHOR, el EventSelectorView lo redirige a /author
    await expect(userPage).toHaveURL(/\/author/, { timeout: 10000 });
    // Verificar que el botón de subir artículo está visible (texto real: '+ SUBIR ARTÍCULO')
    await expect(userPage.getByRole('button', { name: /subir artículo/i }).first()).toBeVisible();

    const userVideoPath = userPage.video() ? await userPage.video().path() : null;
    const adminVideoPath = adminPage.video() ? await adminPage.video().path() : null;
    await userContext.close();
    await adminContext.close();
    if (adminVideoPath) {
      await testInfo.attach('Video Admin (Creación y Aprobación)', {
        path: adminVideoPath,
        contentType: 'video/webm'
      });
    }
    if (userVideoPath) {
      await testInfo.attach('Video Usuario (Ingreso por código y Solicitud)', {
        path: userVideoPath,
        contentType: 'video/webm'
      });
    }
  });
});
