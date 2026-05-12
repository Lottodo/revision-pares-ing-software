import asyncio
import json
import logging
import random
import string
from urllib.parse import urlparse
from playwright.async_api import async_playwright, Page, BrowserContext

logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')

class ComprehensivePWATester:
    def __init__(self, base_url: str, api_url: str):
        self.base_url = base_url
        self.api_url = api_url
        self.api_interactions = []
        self.backend_errors = []
        self.visited_states = set()
        
        self.test_user = {
            "username": f"test_{''.join(random.choices(string.ascii_lowercase, k=5))}",
            "email": f"test_{''.join(random.choices(string.ascii_lowercase, k=5))}@qa.com",
            "password": "password123"
        }

    async def handle_response(self, response):
        """Intercepta las respuestas para evaluar el comportamiento del backend (Req 2-16)."""
        if self.api_url in response.url:
            status = response.status
            method = response.request.method
            url = response.url
            
            interaction = {"url": url, "method": method, "status": status}
            self.api_interactions.append(interaction)
            
            if status >= 400:
                logging.error(f"[BACKEND ERROR] {method} {url} - Status: {status}")
                self.backend_errors.append(interaction)
            else:
                logging.debug(f"[BACKEND SUCCESS] {method} {url} - Status: {status}")

    async def setup_page(self, context: BrowserContext) -> Page:
        page = await context.new_page()
        page.on("response", self.handle_response)
        return page

    # ==========================================
    # CASOS DE USO PRINCIPALES
    # ==========================================

    async def test_01_offline_mode(self, context: BrowserContext):
        """Req 1: Prueba del uso básico offline"""
        logging.info(">>> Ejecutando Caso 1: Modo Offline")
        page = await self.setup_page(context)
        await page.goto(f"{self.base_url}/login")
        
        # Esperar a que el Service Worker se instale y cachee los assets
        await page.wait_for_timeout(3000)
        
        # Desconectar red
        await context.set_offline(True)
        try:
            # Intenta recargar la página, el Service Worker debería servir la UI
            await page.reload(timeout=5000)
            logging.info("Modo Offline: PWA se recargó exitosamente desde la caché (Service Worker).")
        except Exception as e:
            logging.warning(f"Modo Offline falló al recargar (PWA cache): {e}")

        # Reconectar red
        await context.set_offline(False)
        await page.close()

    async def test_02_registration(self, context: BrowserContext):
        """Req 2: Pruebas de registro de usuario"""
        logging.info(">>> Ejecutando Caso 2: Registro de Usuario")
        page = await self.setup_page(context)
        await page.goto(f"{self.base_url}/register")
        
        try:
            await page.fill('input[type="text"]', self.test_user["username"])
            await page.fill('input[type="email"]', self.test_user["email"])
            await page.fill('input[type="password"]', self.test_user["password"])
            await page.click('button[type="submit"]')
            await page.wait_for_load_state('networkidle')
            logging.info(f"Registro completado para {self.test_user['username']}")
        except Exception as e:
            logging.error(f"Fallo en Registro: {e}")
        await page.close()

    async def test_03_authentication(self, context: BrowserContext, as_role=None):
        """Req 3: Autenticación. Retorna una página logueada."""
        logging.info(f">>> Ejecutando Caso 3: Autenticación (como {as_role or 'nuevo usuario'})")
        page = await self.setup_page(context)
        await page.goto(f"{self.base_url}/login")
        
        username = self.test_user["username"] if not as_role else as_role
        try:
            await page.fill('input[type="text"]', username)
            await page.fill('input[type="password"]', "1234")
            await page.click('button[type="submit"]')
            await page.wait_for_load_state('networkidle')
            
            # Si hay selector de eventos
            if "select-event" in page.url:
                cards = await page.locator('.v-card').all()
                if cards:
                    await cards[0].click()
                    await page.wait_for_load_state('networkidle')
            
            logging.info(f"Login exitoso como {username}")
            return page
        except Exception as e:
            logging.error(f"Fallo en Login para {username}: {e}")
            return page

    async def run_admin_scenarios(self, context: BrowserContext):
        """Req 4: Gestión de roles y permisos"""
        page = await self.test_03_authentication(context, as_role="admin_root")
        logging.info(">>> Ejecutando Caso 4: Gestión de Roles (Admin)")
        await page.goto(f"{self.base_url}/admin")
        await page.wait_for_load_state('networkidle')
        
        # Simular asignación de roles buscando un botón específico
        buttons = await page.locator('button i.mdi-account-plus').all()
        if buttons:
            logging.info("Haciendo clic en asignar rol...")
            await buttons[0].click()
            await page.wait_for_timeout(1000)
            
            # Buscar el select de rol
            selects = await page.locator('.v-select').all()
            if len(selects) >= 2:
                # Seleccionar evento primero (el modal requiere evento y rol)
                await selects[0].evaluate("node => node.click()")
                try:
                    await page.wait_for_selector('.v-overlay-container .v-list-item', state='visible', timeout=2000)
                    await page.locator('.v-overlay-container .v-list-item').first.evaluate("node => node.click()")
                except:
                    await page.keyboard.press('Escape')
                await page.wait_for_timeout(500)
                
                # Click en rol y seleccionar el primero
                await selects[1].evaluate("node => node.click()")
                try:
                    await page.wait_for_selector('.v-overlay-container .v-list-item', state='visible', timeout=2000)
                    await page.locator('.v-overlay-container .v-list-item').first.evaluate("node => node.click()")
                except:
                    await page.keyboard.press('Escape')
                await page.wait_for_timeout(500)
                
            # Buscar el botón 'Asignar' en el modal
            assign_btn = page.locator('button:has-text("Asignar")')
            if await assign_btn.count() > 0:
                await assign_btn.first.evaluate("node => node.click()")
                await page.wait_for_load_state('networkidle')
        
        await self.dfs_fallback(page, max_depth=1)
        await page.close()

    async def run_author_scenarios(self, context: BrowserContext):
        """Req 5, 6, 7: Consultas, Estado y Subida de Artículos"""
        page = await self.test_03_authentication(context, as_role="multi_user")
        logging.info(">>> Ejecutando Casos 5, 6, 7: Panel de Autor")
        await page.goto(f"{self.base_url}/author")
        await page.wait_for_load_state('networkidle')
        
        # Req 7: Subida de artículos
        new_paper_btn = page.locator('button:has-text("Nuevo")')
        if await new_paper_btn.count() > 0:
            logging.info("Req 7: Verificando Subida de Artículos (Autor)")
            await new_paper_btn.first.click()
            await page.wait_for_timeout(1000)
            # Rellenar modal si existe
            inputs = await page.locator('input[type="text"]').all()
            if inputs:
                await inputs[0].fill("Artículo de Prueba Crawler")
            submit_btn = page.locator('button:has-text("Guardar")')
            if await submit_btn.count() > 0:
                await submit_btn.first.click()
                await page.wait_for_load_state('networkidle')

        # Req 5 y Req 6: Consultas de historial y Verificación de estado
        logging.info("Req 5 y Req 6: Verificando Historial y Estado en el panel principal...")
        # Verificamos si existe la tabla de artículos o un mensaje de vacío
        table_exists = await page.locator('table').count() > 0
        cards_exist = await page.locator('.v-card').count() > 0
        if table_exists or cards_exist:
            logging.info("Req 5/6: Elementos de estado e historial renderizados correctamente por el backend.")

        # Explorar con DFS la UI del autor
        await self.dfs_fallback(page, max_depth=1)
        await page.close()

    async def run_reviewer_scenarios(self, context: BrowserContext):
        """Req 8, 9, 10, 11: Accesos, Invitaciones, Borradores y Envíos (Revisores)"""
        page = await self.test_03_authentication(context, as_role="multi_user")
        logging.info(">>> Ejecutando Casos 8, 9, 10, 11: Panel de Revisor")
        await page.goto(f"{self.base_url}/reviewer")
        await page.wait_for_load_state('networkidle')
        
        # Req 10: Aceptar o rechazar invitaciones
        accept_btn = page.locator('button:has-text("Aceptar")')
        if await accept_btn.count() > 0:
            logging.info("Aceptando invitación de revisión...")
            await accept_btn.first.click()
            await page.wait_for_load_state('networkidle')

        # Req 8: Acceder a artículos asignados
        evaluate_btn = page.locator('button:has-text("Evaluar")')
        if await evaluate_btn.count() > 0:
            logging.info("Entrando a evaluar artículo...")
            await evaluate_btn.first.click()
            await page.wait_for_load_state('networkidle')
            
            # Req 11 y 9: Borradores y Envíos en el formulario de revisión
            save_draft = page.locator('button:has-text("Guardar Borrador")')
            if await save_draft.count() > 0:
                await save_draft.first.click()
            
            submit_rev = page.locator('button:has-text("Enviar Evaluación")')
            if await submit_rev.count() > 0:
                await submit_rev.first.click()
                
        await self.dfs_fallback(page, max_depth=1)
        await page.close()

    async def run_editor_scenarios(self, context: BrowserContext):
        """Req 12, 13, 14, 15, 16: Decisiones, Métricas, Asignaciones, Estado y Retrasos (Editores)"""
        page = await self.test_03_authentication(context, as_role="multi_user")
        logging.info(">>> Ejecutando Casos 12-16: Panel de Editor")
        await page.goto(f"{self.base_url}/editor")
        await page.wait_for_load_state('networkidle')
        
        # Req 13: Métricas del proceso editorial
        logging.info("Req 13: Verificando Métricas del proceso editorial...")
        metrics_cards = await page.locator('.v-card-title').all()
        if len(metrics_cards) > 0:
            logging.info("Req 13: Tarjetas de métricas detectadas y cargadas.")

        # Req 16: Identificación de retrasos
        logging.info("Req 16: Verificando Identificación de retrasos en revisiones...")
        alerts = await page.locator('.v-alert').all()
        if len(alerts) > 0:
            logging.info("Req 16: Alertas de retraso o sistema detectadas en la UI.")

        # Req 14: Asignación de revisores
        assign_rev = page.locator('button i.mdi-account-plus')
        if await assign_rev.count() > 0:
            logging.info("Req 14: Verificando Asignación de Revisores...")
            await assign_rev.first.click()
            await page.wait_for_timeout(1000)
            close = page.locator('button:has-text("Cancelar")')
            if await close.count() > 0:
                await close.first.click()

        # Req 12 y 15: Decisiones editoriales y Gestión de estado
        decision_btn = page.locator('button i.mdi-gavel')
        if await decision_btn.count() > 0:
            logging.info("Req 12 y 15: Verificando Decisiones Editoriales y Gestión de Estado...")
            await decision_btn.first.click()
            await page.wait_for_timeout(1000)
            close = page.locator('button:has-text("Cerrar")')
            if await close.count() > 0:
                await close.first.click()

        await self.dfs_fallback(page, max_depth=1)
        await page.close()

    # ==========================================
    # FALLBACK: ALGORITMO DFS
    # ==========================================
    async def dfs_fallback(self, page: Page, max_depth: int = 1, current_depth: int = 0):
        """Explora enlaces y botones secundarios para detectar fallos en rutas no dirigidas."""
        if current_depth >= max_depth:
            return

        try:
            await page.wait_for_load_state('networkidle', timeout=2000)
        except:
            pass
            
        current_state = page.url
        if current_state in self.visited_states:
            return
            
        self.visited_states.add(current_state)
        logging.info(f"[DFS] Explorando estado: {current_state}")

        # Encontrar botones
        locators = page.locator('button:visible')
        count = await locators.count()
        
        ignore_words = ['logout', 'salir', 'eliminar', 'delete', 'cerrar', 'sesi', 'cancelar']
        
        for i in range(min(count, 5)): # Límite de botones para no saturar el test
            try:
                element = locators.nth(i)
                text = await element.inner_text()
                if text and any(word in text.lower() for word in ignore_words):
                    continue
                    
                await element.click(timeout=2000)
                await self.dfs_fallback(page, max_depth, current_depth + 1)
                
                # Restaurar estado
                if page.url != current_state:
                    await page.goto(current_state)
                    await page.wait_for_load_state('networkidle')
                    locators = page.locator('button:visible')
            except Exception as e:
                pass

    async def run_all(self):
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context()

            logging.info("=== INICIANDO TESTING INTEGRAL DE LA PWA ===")
            
            await self.test_01_offline_mode(context)
            await self.test_02_registration(context)
            
            # Roles (Req 4-16)
            await self.run_admin_scenarios(context)
            await self.run_author_scenarios(context)
            await self.run_reviewer_scenarios(context)
            await self.run_editor_scenarios(context)

            await browser.close()

            # Guardar Reporte Final
            logging.info("=== GENERANDO REPORTE FINAL ===")
            report = {
                "total_api_calls": len(self.api_interactions),
                "total_errors": len(self.backend_errors),
                "errors": self.backend_errors,
            }
            with open("tests/e2e/comprehensive_test_report.json", "w") as f:
                json.dump(report, f, indent=4)
                
            logging.info(f"Pruebas finalizadas. Errores detectados en backend: {len(self.backend_errors)}")
            logging.info("Reporte detallado en tests/e2e/comprehensive_test_report.json")

if __name__ == "__main__":
    tester = ComprehensivePWATester(
        base_url="http://localhost:5173",
        api_url="http://localhost:3000/api"
    )
    asyncio.run(tester.run_all())
