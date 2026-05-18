import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage.js';
import { DashboardPage } from '../pages/DashboardPage.js';
import { RegisterPage } from '../pages/RegisterPage.js';
import { APIHelper } from '../helpers/api-helpers.js';

export const test = base.extend({
  loginPage: async ({ page }, use) => { await use(new LoginPage(page)); },
  dashboardPage: async ({ page }, use) => { await use(new DashboardPage(page)); },
  registerPage: async ({ page }, use) => { await use(new RegisterPage(page)); },
  apiHelper: async ({ request }, use) => { await use(new APIHelper(request)); }
});
export const expect = test.expect;
