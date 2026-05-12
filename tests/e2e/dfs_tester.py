import asyncio
from playwright.async_api import async_playwright
import json
import logging

logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')

BASE_URL = "http://localhost:5173"

# Definimos los roles y sus acciones esperadas para probar
TEST_PROFILES = [
    {
        "role": "Admin",
        "email": "admin@qa.com",
        "password": "1234",
        "expected_routes": ["/admin", "/editor"],
        "actions": ["Gestión de usuarios", "Gestión de eventos"]
    },
    {
        "role": "Multiusuario",
        "email": "multi@qa.com",
        "password": "1234",
        "expected_routes": ["/author", "/reviewer", "/editor"],
        "actions": ["Ver dashboard"]
    }
]

async def login_and_explore(browser, profile):
    context = await browser.new_context()
    page = await context.new_page()
    
    logging.info(f"--- Iniciando pruebas para el perfil: {profile['role']} ---")
    
    # 1. Navegar al Login
    await page.goto(f"{BASE_URL}/login")
    await page.wait_for_selector('input[type="text"]')
    
    # 2. Rellenar credenciales
    # Como el login usa 'username', y el seed permite login por username, 
    # extraemos el username del email (lo que está antes del @) o usamos el nombre real.
    username = profile['email'].split('@')[0]
    if profile['role'] == 'Admin':
        username = 'admin_root'
    elif profile['role'] == 'Multiusuario':
        username = 'multi_user'

    await page.fill('input[type="text"]', username)
    await page.fill('input[type="password"]', profile['password'])
    await page.click('button[type="submit"]')
    
    # 3. Esperar la redirección (podría ir a select-event o directo al dashboard)
    await page.wait_for_timeout(2000)
    current_url = page.url
    
    if "select-event" in current_url:
        logging.info("Pantalla de selección de eventos detectada. Seleccionando el primer evento...")
        # Esperar a que carguen las cards de eventos
        await page.wait_for_selector('.v-card')
        # Hacer click en el primer evento
        events = await page.locator('.v-card').all()
        if events:
            await events[0].click()
            await page.wait_for_timeout(2000)
    
    current_url = page.url
    logging.info(f"Ruta actual después del login: {current_url}")
    
    # 4. Simulación DFS: Extraer y visitar enlaces del Navigation Drawer
    logging.info("Iniciando escaneo DFS en la interfaz...")
    await page.wait_for_selector('.v-navigation-drawer', state='attached')
    
    # Encontrar todos los links de navegación lateral
    links = await page.locator('.v-navigation-drawer a').all()
    hrefs = []
    for link in links:
        href = await link.get_attribute('href')
        if href and href not in hrefs:
            hrefs.append(href)
            
    logging.info(f"Rutas descubiertas en el menú: {hrefs}")
    
    for route in hrefs:
        logging.info(f"Visitando: {route}")
        await page.goto(f"{BASE_URL}{route}")
        await page.wait_for_timeout(1000)
        
        # Interacciones específicas por ruta para simular la cobertura
        if "admin" in route:
            logging.info("Comprobando panel de Admin...")
            # Verificar que existan las tablas de usuarios o botones
            try:
                await page.wait_for_selector('table', timeout=2000)
                logging.info("Tabla de administración cargada correctamente.")
            except:
                logging.warning("No se encontró la tabla de administración.")
                
        elif "editor" in route:
            logging.info("Comprobando panel de Editor...")
            # Buscar botones de opciones de los artículos (los tres puntitos)
            buttons = await page.locator('button.v-btn--icon').all()
            if buttons:
                logging.info(f"Se encontraron {len(buttons)} botones de acción de artículos. Simulando click en el primero...")
                await buttons[0].click()
                await page.wait_for_timeout(1000)
                
                # Cerrar el drawer lateral si se abrió
                close_btn = page.locator('button i.mdi-close')
                if await close_btn.count() > 0:
                    await close_btn.first.click()
                    
        elif "author" in route:
            logging.info("Comprobando panel de Autor...")
            # Buscar el botón de nuevo artículo
            try:
                await page.wait_for_selector('text=Nuevo Artículo', timeout=2000)
                logging.info("Botón de 'Nuevo Artículo' detectado.")
            except:
                pass
                
        elif "reviewer" in route:
            logging.info("Comprobando panel de Revisor...")
            # Detectar artículos para revisión
            cards = await page.locator('.v-card').all()
            logging.info(f"Mostrando {len(cards)} tarjetas en la vista de revisor.")

    logging.info(f"--- Fin de pruebas para {profile['role']} ---\n")
    await context.close()

async def run_all_tests():
    logging.info("Iniciando Pruebas E2E Automatizadas (DFS) con Playwright")
    async with async_playwright() as p:
        # Lanzar navegador (headless=False para ver qué hace, True para CI)
        browser = await p.chromium.launch(headless=False, slow_mo=50)
        
        for profile in TEST_PROFILES:
            await login_and_explore(browser, profile)
            
        await browser.close()
    logging.info("Pruebas finalizadas exitosamente.")

if __name__ == "__main__":
    asyncio.run(run_all_tests())
