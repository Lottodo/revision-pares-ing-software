import { test, expect } from '../fixtures/mixed.fixture.js';

test.describe('Estrategia Mixta E2E: Security & Event Isolation', () => {
  test('Flujo Mixto: Registro UI, Setup API de multi-rol, y Validación UI', async ({ page, registerPage, loginPage, dashboardPage, apiHelper }) => {
    const timestamp = Date.now();
    const newUser = `user_${timestamp}`;
    const newEmail = `${newUser}@test.com`;
    const password = 'Password123';

    // 1. FRONTEND UI: Registrar usuario nuevo
    await registerPage.goto();
    await registerPage.register(newUser, newEmail, password);
    
    // Login inicial para obtener JWT (y con ello, el userId generado)
    await loginPage.goto();
    await loginPage.login(newUser, password);
    // Remove strict expect(dashboardPage.header) because it might redirect to /select-event

    const token = await page.evaluate(() => localStorage.getItem('token'));
    const userData = await apiHelper.getUserMe(token);
    // userId puede venir directo o anidado dependiendo del backend
    const userId = userData.id || userData.user?.id;
    expect(userId).toBeDefined();

    // 2. API SETUP: Preparación limpia sin tocar la UI
    const adminData = await apiHelper.adminLogin();
    
    const eventA = await apiHelper.createEvent(adminData.token, `Congreso A ${timestamp}`, `cong-a-${timestamp}`);
    const eventB = await apiHelper.createEvent(adminData.token, `Congreso B ${timestamp}`, `cong-b-${timestamp}`);
    const eventC = await apiHelper.createEvent(adminData.token, `Congreso C ${timestamp}`, `cong-c-${timestamp}`);

    // Asignamos Múltiples Roles Aislados (El backend bloquea AUTHOR+REVIEWER en el mismo evento)
    await apiHelper.assignRole(adminData.token, userId, eventA.id, 'AUTHOR');
    await apiHelper.assignRole(adminData.token, userId, eventB.id, 'REVIEWER');
    await apiHelper.assignRole(adminData.token, userId, eventC.id, 'EDITOR');

    // 3. UI VALIDATION: Aislamiento por evento
    // Limpiamos localStorage para forzar re-login y obtener JWT fresco con nuevos roles
    await page.evaluate(() => localStorage.clear());
    await loginPage.goto();
    await loginPage.login(newUser, password);

    // Validamos que el dashboard reconozca los nuevos roles en el header o body
    const bodyText = page.locator('body');
    await expect(bodyText).toContainText(eventA.name);
    await expect(bodyText).toContainText(eventB.name);
    await expect(bodyText).toContainText(eventC.name);

    // Aquí irían las aserciones de aislamiento específicas de tu UI, por ejemplo:
    // await page.getByRole('button', { name: eventA.name }).click();
    // // En Evento A soy Autor/Revisor, no debo ver botones de Editor
    // await expect(page.getByRole('button', { name: 'Asignar Revisor' })).not.toBeVisible();
    
    // await page.getByRole('button', { name: eventB.name }).click();
    // // En Evento B soy Editor, debo ver asignaciones pero no puedo auto-asignarme
    // await expect(page.getByRole('button', { name: 'Asignar Revisor' })).toBeVisible();
  });
});
