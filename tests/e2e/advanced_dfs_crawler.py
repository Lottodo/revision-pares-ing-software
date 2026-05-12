import asyncio
import json
import logging
from urllib.parse import urlparse
from playwright.async_api import async_playwright, Page

logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')

class PWADFSCrawler:
    def __init__(self, base_url: str, api_url: str, max_depth: int = 3):
        self.base_url = base_url
        self.api_url = api_url
        self.max_depth = max_depth
        self.visited_states = set()
        self.api_interactions = []
        self.backend_errors = []

    async def handle_response(self, response):
        """Intercepte las respuestas de red para evaluar el comportamiento del backend."""
        # Solo nos interesan las peticiones a nuestra API
        if self.api_url in response.url:
            status = response.status
            method = response.request.method
            url = response.url
            
            interaction = {
                "url": url,
                "method": method,
                "status": status,
            }
            self.api_interactions.append(interaction)
            
            if status >= 400:
                logging.error(f"Error detectado en Backend: {method} {url} - Status: {status}")
                self.backend_errors.append(interaction)
            else:
                logging.info(f"Éxito API: {method} {url} - Status: {status}")

    async def get_state_hash(self, page: Page) -> str:
        """
        En una PWA, la URL no siempre cambia. Una forma básica de identificar 
        el estado es usar la URL + un resumen de los elementos interactivos.
        Para simplificar, usaremos la URL actual.
        """
        # Esperar a que la red se estabilice
        try:
            await page.wait_for_load_state('networkidle', timeout=3000)
        except:
            pass
        return page.url

    async def dfs_explore(self, page: Page, current_depth: int = 0):
        """
        Función recursiva para explorar la interfaz usando DFS.
        """
        if current_depth >= self.max_depth:
            logging.info(f"Límite de profundidad alcanzado ({self.max_depth}). Retrocediendo.")
            return

        current_state = await self.get_state_hash(page)
        
        if current_state in self.visited_states:
            logging.info(f"Estado ya visitado: {current_state}. Retrocediendo.")
            return

        logging.info(f"Explorando estado (Profundidad {current_depth}): {current_state}")
        self.visited_states.add(current_state)

        # Encontrar elementos interactivos (botones y enlaces)
        # Evitamos elementos de navegación externa o de cierre de sesión
        locators = page.locator('button:visible, a:visible')
        count = await locators.count()
        
        logging.info(f"Se encontraron {count} elementos interactivos en este estado.")

        for i in range(count):
            element = locators.nth(i)
            
            # Obtener algo de contexto del botón para evitar salir del bucle
            try:
                text = await element.inner_text()
                tag_name = await element.evaluate("el => el.tagName")
                href = await element.get_attribute('href')
                
                # Evitar acciones destructivas masivas o cerrar sesión en la exploración automática
                ignore_words = ['logout', 'salir', 'eliminar', 'delete', 'cerrar', 'sesi', 'cancelar']
                if text and any(word in text.lower() for word in ignore_words):
                    continue
                if href and not href.startswith(('/', self.base_url)):
                    continue
                    
                logging.info(f"Haciendo click en [{tag_name}] '{text.strip()}'")
                
                # En un DFS real en un navegador, hacer click cambia el DOM.
                try:
                    await element.click(timeout=3000)
                except Exception as e:
                    logging.debug(f"Error al hacer clic en elemento {i}: {e}")
                    continue
                
                # Llamada recursiva para el nuevo estado
                await self.dfs_explore(page, current_depth + 1)
                
                # Restaurar el estado para el siguiente elemento en este nivel
                current_url_after = page.url
                if current_url_after != current_state:
                    logging.info(f"Restaurando estado: volviendo a {current_state}")
                    await page.goto(current_state)
                    await page.wait_for_load_state('networkidle')
                    
                    # Como recargamos la página, necesitamos re-evaluar los localizadores
                    locators = page.locator('button:visible, a:visible')
                    count = await locators.count()
                
            except Exception as e:
                # Ignorar errores de elementos que desaparecieron (Stale) u ocultos
                logging.debug(f"No se pudo interactuar con el elemento {i}: {e}")

    async def run(self):
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=False) # Ver visualmente
            context = await browser.new_context()
            page = await context.new_page()

            # Escuchar todas las respuestas de red
            page.on("response", self.handle_response)

            logging.info("Iniciando escaneo DFS...")
            # 1. Autenticación inicial (requerida para explorar app)
            await page.goto(f"{self.base_url}/login")
            
            # SIMULACIÓN DE LOGIN - Ajusta con credenciales reales
            try:
                await page.fill('input[type="text"]', "admin_root")
                await page.fill('input[type="password"]', "1234")
                await page.click('button[type="submit"]')
                await page.wait_for_load_state('networkidle')
            except Exception as e:
                logging.error(f"Fallo en el login: {e}")

            # 2. Iniciar búsqueda en profundidad
            await self.dfs_explore(page, 0)

            await browser.close()

            # 3. Reporte de resultados
            logging.info("--- REPORTE FINAL ---")
            logging.info(f"Total de llamadas a API interceptadas: {len(self.api_interactions)}")
            logging.info(f"Total de errores (4xx/5xx): {len(self.backend_errors)}")
            
            with open("dfs_api_report.json", "w") as f:
                json.dump({
                    "total_interactions": len(self.api_interactions),
                    "errors": self.backend_errors,
                    "all_requests": self.api_interactions
                }, f, indent=4)
                
            logging.info("Reporte guardado en 'dfs_api_report.json'")

if __name__ == "__main__":
    crawler = PWADFSCrawler(
        base_url="http://localhost:5173",
        api_url="http://localhost:3000/api", # Ajusta a la URL de tu backend
        max_depth=3 # Mantener bajo para evitar bucles infinitos
    )
    asyncio.run(crawler.run())
