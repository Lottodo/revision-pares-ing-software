import requests
import os
import time
import random

# =============================================
# CONFIGURACIÓN
# =============================================
BASE_URL = "https://api.openalex.org/works"
BASE_DIR = "D:/Practicas/SOFTWARE/revision-pares-ing-software/PAPERS"

areas_estudio = {
    'INGENIERIA':   15,
    'HISTORIA':     10,
    'ECONOMIA':      5,
    'PSICOLOGIA':   10,
    'QUIMICA':       5,
    'COMPUTACION':  15,
    'LITERATURA':   10,
    'TEOLOGIA':     10
}

HEADERS = {
    "User-Agent": "revision-pares-proyecto/1.0 (astrid.jimenez.barrera@uabc.edu.mx)"
}

# =============================================
# FUNCIONES
# =============================================
def create_folders():
    os.makedirs(BASE_DIR, exist_ok=True)
    for area in areas_estudio:
        os.makedirs(os.path.join(BASE_DIR, area), exist_ok=True)

def contar_existentes(area):
    """Cuenta cuántos PDFs ya hay en la carpeta del área"""
    carpeta = os.path.join(BASE_DIR, area)
    return len([f for f in os.listdir(carpeta) if f.endswith('.pdf')])

def get_papers(area, cantidad, pagina=1):
    """Obtiene papers de OpenAlex — pide más de los necesarios por si algunos fallan"""
    params = {
        "search": area,
        "sort": "relevance_score:desc",
        "per_page": min(cantidad * 4, 200),  # ✅ pide 4x para compensar fallos
        "page": pagina,
        "filter": "open_access.is_oa:true",
        "select": "id,title,open_access,doi"
    }
    try:
        response = requests.get(BASE_URL, params=params, headers=HEADERS, timeout=15)
        response.raise_for_status()
        return response.json().get("results", [])
    except Exception as e:
        print(f"  ❌ Error al consultar OpenAlex: {e}")
        return []

def download_pdf(pdf_url, area, index, title):
    """Descarga un PDF y lo guarda con índice correcto"""
    file_name = f"paper_{area}_{index}.pdf"
    file_path = os.path.join(BASE_DIR, area, file_name)

    try:
        resp = requests.get(pdf_url, headers=HEADERS, timeout=20, verify=False)  # verify=False evita el SSL error
        resp.raise_for_status()

        content_type = resp.headers.get("Content-Type", "")
        if "pdf" not in content_type.lower() and not pdf_url.lower().endswith(".pdf"):
            print(f"  ⚠ No es PDF ({content_type[:30]}): {pdf_url[:60]}")
            return False

        with open(file_path, "wb") as f:
            f.write(resp.content)

        print(f"  ✅ [{index}] Descargado: {file_name}")
        print(f"      Título: {title[:70]}")
        return True

    except Exception as e:
        print(f"  ❌ Error: {str(e)[:80]}")
        return False

# =============================================
# MAIN
# =============================================
# Silencia el warning de SSL (por verify=False)
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

create_folders()
total_descargados = 0

for area, meta in areas_estudio.items():
    ya_hay = contar_existentes(area)           # ✅ cuántos PDF ya existen
    faltan = meta - ya_hay                     # ✅ cuántos faltan para llegar a la meta

    print(f"\n📚 {area}: meta={meta} | ya descargados={ya_hay} | faltan={faltan}")

    if faltan <= 0:
        print(f"  ✅ Ya está completo, saltando...")
        continue

    papers = get_papers(area, faltan)
    if not papers:
        print(f"  ⚠ No se encontraron papers para {area}")
        continue

    descargados_ahora = 0
    proximo_indice = ya_hay + 1                # ✅ continúa numeración desde donde quedó

    for paper in papers:
        if descargados_ahora >= faltan:        # ✅ para cuando ya completó la diferencia
            break

        titulo = paper.get("title", "Sin título")
        pdf_url = paper.get("open_access", {}).get("oa_url")

        if not pdf_url:
            continue

        print(f"  🔗 {pdf_url[:70]}")
        exito = download_pdf(pdf_url, area, proximo_indice, titulo)

        if exito:
            descargados_ahora += 1
            proximo_indice += 1
            total_descargados += 1

        time.sleep(random.uniform(1, 2.5))

    print(f"  📊 Descargados ahora: {descargados_ahora} | Total en carpeta: {ya_hay + descargados_ahora}/{meta}")

print(f"\n✅ Proceso completado. Nuevos PDFs descargados: {total_descargados}")