import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('http://localhost:5173/login');
  await page.getByRole('textbox', { name: 'Usuario' }).click();
  await page.getByRole('textbox', { name: 'Usuario' }).fill('autor1');
  await page.getByRole('textbox', { name: 'Contraseña' }).click();
  await page.getByRole('textbox', { name: 'Contraseña' }).fill('1234');
  await page.getByRole('button', { name: 'Acceder al Sistema' }).click();
  await page.getByRole('link', { name: 'Tus Manuscritos' }).click();
  await page.getByRole('link', { name: 'Subir Artículo' }).click();
  await page.getByRole('button', { name: 'Salir' }).click();
});