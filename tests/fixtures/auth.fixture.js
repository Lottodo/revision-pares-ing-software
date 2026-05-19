import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage.js';
import { DashboardPage } from '../pages/DashboardPage.js';
import { PaperPage } from '../pages/PaperPage.js';
import { ReviewPage } from '../pages/ReviewPage.js';

// Extend base test with our POMs and custom Auth contexts
export const test = base.extend({
  // Page Objects
  loginPage: async ({ page }, use) => { await use(new LoginPage(page)); },
  dashboardPage: async ({ page }, use) => { await use(new DashboardPage(page)); },
  paperPage: async ({ page }, use) => { await use(new PaperPage(page)); },
  reviewPage: async ({ page }, use) => { await use(new ReviewPage(page)); },

  // API Authenticated Users (via Backend API to bypass UI flakiness)
  autorUser: async ({ request }, use) => {
    // 1. Login to get available events
    let res = await request.post('http://127.0.0.1:3000/api/auth/login', {
      data: { username: 'autor_pro', password: '1234' }
    });
    let loginBody = await res.json();
    const eventId = loginBody.data.events[0].event.id;
    
    // 2. Switch event to get token with event context
    res = await request.post('http://127.0.0.1:3000/api/auth/switch-event', {
      headers: { Authorization: `Bearer ${loginBody.data.token}` },
      data: { eventId }
    });
    let switchBody = await res.json();
    
    const activeEvent = {
        event: { id: eventId, name: switchBody.data.eventName },
        roles: switchBody.data.roles
    };
    
    await use({ 
      token: switchBody.data.token, 
      user: switchBody.data.user || loginBody.data.user,
      activeEvent: JSON.stringify(activeEvent),
      userEvents: JSON.stringify(loginBody.data.events)
    });
  },
  editorUser: async ({ request }, use) => {
    let res = await request.post('http://127.0.0.1:3000/api/auth/login', {
      data: { username: 'editor_pro', password: '1234' }
    });
    let loginBody = await res.json();
    const eventId = loginBody.data.events[0].event.id;
    
    res = await request.post('http://127.0.0.1:3000/api/auth/switch-event', {
      headers: { Authorization: `Bearer ${loginBody.data.token}` },
      data: { eventId }
    });
    let switchBody = await res.json();
    
    const activeEvent = {
        event: { id: eventId, name: switchBody.data.eventName },
        roles: switchBody.data.roles
    };

    await use({ 
      token: switchBody.data.token, 
      user: switchBody.data.user || loginBody.data.user,
      activeEvent: JSON.stringify(activeEvent),
      userEvents: JSON.stringify(loginBody.data.events)
    });
  },
  revisorUser: async ({ request }, use) => {
    let res = await request.post('http://127.0.0.1:3000/api/auth/login', {
      data: { username: 'revisor_pro', password: '1234' }
    });
    let loginBody = await res.json();
    const eventId = loginBody.data.events[0].event.id;
    
    res = await request.post('http://127.0.0.1:3000/api/auth/switch-event', {
      headers: { Authorization: `Bearer ${loginBody.data.token}` },
      data: { eventId }
    });
    let switchBody = await res.json();
    
    const activeEvent = {
        event: { id: eventId, name: switchBody.data.eventName },
        roles: switchBody.data.roles
    };

    await use({ 
      token: switchBody.data.token, 
      user: switchBody.data.user || loginBody.data.user,
      activeEvent: JSON.stringify(activeEvent),
      userEvents: JSON.stringify(loginBody.data.events)
    });
  },

  // Authenticated Browser Contexts (Autor example)
  autorPage: async ({ page, autorUser }, use) => {
    // Navigate to root first to initialize localStorage origin
    await page.goto('/');
    await page.evaluate((authData) => {
      localStorage.setItem('token', authData.token);
      localStorage.setItem('user', JSON.stringify(authData.user));
      localStorage.setItem('activeEvent', authData.activeEvent);
      localStorage.setItem('userEvents', authData.userEvents);
    }, autorUser);
    
    // Forzar navegación al dashboard y esperar a que la sesión esté completamente asentada y el banner visible
    await page.goto('/author');
    await expect(page.getByRole('banner')).toBeVisible({ timeout: 15000 });
    
    await use(page);
  },
  
  editorPage: async ({ browser, editorUser }, use) => {
    // Para no chocar con la sesión del autor si usamos ambos en la misma prueba,
    // creamos un nuevo contexto de navegador aislado para el editor.
    const context = await browser.newContext();
    const page = await context.newPage();
    
    await page.goto('/');
    await page.evaluate((authData) => {
      localStorage.setItem('token', authData.token);
      localStorage.setItem('user', JSON.stringify(authData.user));
      localStorage.setItem('activeEvent', authData.activeEvent);
      localStorage.setItem('userEvents', authData.userEvents);
    }, editorUser);
    await use(page);
    await context.close();
  }
});

export const expect = test.expect;
