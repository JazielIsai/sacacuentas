# SacaCuentas (sacacuentas.isai-dev.com)

Calculadoras laborales y financieras para México, explicadas paso a paso (aguinaldo, finiquito, liquidación, vacaciones, ISR, inversiones e intereses de tarjeta), y comparador diario de **precios de gasolina** por estado y municipio.

**Stack:** Astro 5 (sitio 100% estático), TypeScript, Tailwind CSS 4, Preact (solo en partes interactivas), MDX, Leaflet + OpenStreetMap y Vitest.
**Publicación:** GitHub Actions construye el sitio a diario con precios nuevos y lo sube a Hostinger por SSH.

---

## ⚠️ Antes de publicar: valores por verificar

Todos los valores que cambian por año viven en [`src/data/valores-2026.ts`](src/data/valores-2026.ts), cada uno con su fuente oficial.
UMA, salarios mínimos, tarifas de ISR y subsidio 2026 se cotejaron con INEGI, DOF y SAT el 23-nov-2026. Pendientes:

| Valor | Estado | Dónde |
|---|---|---|
| Pago mínimo de tarjeta | Cotejado con la Circular 13/2011; falta revisar la Circular 14/2014 | `src/data/ley.ts` |
| Aviso de privacidad | Falta decidir si se agrega el domicilio del responsable | `src/pages/aviso-de-privacidad.astro` |
| **Tasas de inversión** (CETES, Nu, Mercado Pago, Openbank, Klar, DiDi, Ualá, Stori, Hey) | Tomadas de prensa y comparadores; confirmar en cada app | `src/data/inversiones.ts` |
| Protección de Mercado Pago | Marcada "por confirmar" | `src/data/inversiones.ts` |

### Tasas de inversión (se actualizan seguido)

**La página está oculta** hasta verificar sus tasas. Para publicarla: renombra `src/pages/_inversiones.astro` a `inversiones.astro` y descomenta su entrada en `src/data/sitio.ts`.

Las tasas del comparador `/inversiones` viven en `src/data/inversiones.ts`. Para cada opción:
1. Confirma la tasa, los tramos (topes) y los requisitos en la app o el sitio oficial.
2. Cambia `verificado: null` por la fecha (`'2026-11-20'`) y actualiza `FECHA_TASAS`.
3. Las tasas son **marginales por tramo**: `[{ hasta: 25000, tasa: 13 }, { hasta: null, tasa: 6.5 }]` = 13% por los primeros $25,000 y 6.5% por el resto.

En modo desarrollo, la página muestra cuántas tasas siguen sin verificar.

Las reglas de la LFT que no cambian cada año (15 días de aguinaldo, tabla de vacaciones dignas, 25% de prima, 3 meses, 20 días, 12 días y tope de 2 SM) están en [`src/data/ley.ts`](src/data/ley.ts) con su artículo.

Busca todos los pendientes con:

```bash
grep -rn "TODO(" src
```

---

## Correr en local

Requiere Node 22 o más reciente (se probó con Node 24).

```bash
npm install
npm run dev        # http://localhost:4321
npm test           # pruebas unitarias
npm run build      # astro check + build de producción en dist/
npm start          # previsualiza dist/ (http://localhost:4321)

npm run gasolina:actualizar   # descarga precios de la CNE → data/gasolina/
npm run gasolina:municipios   # (rara vez) vuelve a bajar los polígonos del INEGI
```

## Estructura

```
src/
├── data/
│   ├── valores-2026.ts   ← valores oficiales del año (con fuentes y TODOs)
│   ├── ley.ts            ← reglas fijas de la LFT / Banxico
│   ├── index.ts          ← getValores(año), ANIO_VIGENTE
│   └── sitio.ts          ← nombre del sitio y lista de calculadoras
│   ├── estados.ts        ← 32 entidades: clave INEGI, nombre y slug
│   └── gasolina.ts       ← lee data/gasolina/ al construir las páginas
├── lib/calculos/         ← lógica pura (sin DOM), una por calculadora
├── lib/gasolina/         ← parseo de XML de la CNE, geografía, promedios
├── components/
│   ├── calculadoras/     ← islas Preact: formulario + resultado + desglose
│   └── *.astro           ← SEO, Header, Footer, AvisoLegal, FAQ
├── content/articulos/    ← artículo MDX de cada calculadora (FAQ en el frontmatter)
├── layouts/              ← Base y Calculadora (JSON-LD WebApplication + FAQPage)
└── pages/                ← una ruta por calculadora, gasolina/[estado]/[municipio], robots.txt, 404
scripts/gasolina/         ← actualizar.ts (diario) y municipios.ts (INEGI)
data/
├── geo/municipios.json   ← polígonos de municipios (INEGI, simplificados)
└── gasolina/
    ├── estaciones.json   ← último snapshot (lo reescribe el workflow diario)
    └── historial/        ← un resumen por día (promedios nacional/estado/municipio)
tests/                    ← Vitest: casos calculados a mano
```

Cada calculadora devuelve `{ total, pasos[], avisos[] }`. Los mismos `pasos` alimentan el desglose en pantalla y las pruebas.

## Actualizar los valores de un año nuevo (p. ej. 2027)

1. Copia `src/data/valores-2026.ts` a `valores-2027.ts` y actualiza cada valor **con su fuente**.
2. Regístralo en `src/data/index.ts` (`REGISTRO`, `PENDIENTES`) y cambia `ANIO_VIGENTE`.
3. Actualiza los títulos "2026" en `src/content/articulos/*.mdx` y la fecha `actualizado`.
4. `npm test && npm run build`.

Las pruebas usan valores fijos de prueba (`tests/fixture.ts`), así que no se rompen al cambiar de año.

## Agregar una calculadora

1. Lógica en `src/lib/calculos/nueva.ts` y pruebas en `tests/calculos/nueva.test.ts`.
2. Isla en `src/components/calculadoras/CalcNueva.tsx`, usando los componentes de `ui.tsx`.
3. Artículo en `src/content/articulos/nueva.mdx`.
4. Página en `src/pages/nueva.astro` (copia una existente) y entrada en `CALCULADORAS` (`src/data/sitio.ts`).

## SEO

- `<title>`, description, canonical, Open Graph y Twitter card por página (`components/SEO.astro`).
- JSON-LD: `WebSite` y `Organization` en la portada; `WebApplication`, `BreadcrumbList` y `FAQPage` en cada calculadora.
- `sitemap-index.xml` automático (`@astrojs/sitemap`), `robots.txt` dinámico y URLs con barra final (`/aguinaldo` redirige 301 a `/aguinaldo/`).
- Imagen Open Graph en `public/og.png`. Para regenerarla: `node scripts/generar-og.mjs`.

---

## Gasolina: cómo funciona

```
CNE (XML, 18:00 diario) ──► GitHub Actions 20:00 CDMX ──► npm run gasolina:actualizar
                                                           ├─ limpia y valida
                                                           ├─ ubica cada estación en su municipio (polígonos INEGI)
                                                           └─ escribe data/gasolina/ (+ histórico, con commit al repo)
                                                      ──► npm test ──► npm run build (~1,600 páginas) ──► rsync a Hostinger
```

**Fuentes**
- Estaciones: `https://publicacionexterna.azurewebsites.net/publicaciones/places` (XML: `place_id`, razón social, permiso, coordenadas).
- Precios: `https://publicacionexterna.azurewebsites.net/publicaciones/prices` (XML: `place_id`, precio por tipo). Página oficial: [CNE, precios de gasolinas y diésel](https://www.cne.gob.mx/ConsultaPrecios/GasolinasyDiesel/GasolinasyDiesel.html).
- Municipios: INEGI, Marco Geoestadístico (diciembre 2025), servicio `gaia.inegi.org.mx/wscatgeo/v2/geo/mgem/{cve_ent}`.

**Limpieza** (`src/lib/gasolina/normalizar.ts`): se descartan coordenadas fuera de México, precios fuera de $15–$40 y atípicos (<70% o >140% de la mediana nacional de cada combustible). Las estaciones repetidas con combustibles separados se combinan.

**Seguridades:** si llegan menos de 10,000 estaciones válidas o se ubica menos del 97% en algún municipio, el script falla, **no se publica nada** y GitHub te avisa por correo. El sitio se queda con la última versión buena.

**"Cerca de mí":** el navegador descarga `/gasolina/estaciones.json` (~1.2 MB, ~300 KB comprimido) solo al pulsar el botón y calcula las distancias ahí mismo. La ubicación del usuario nunca sale de su navegador. Ese mismo JSON sirve como API pública estática.

**Mapas:** usan los tiles de OpenStreetMap con su atribución. Si el tráfico crece mucho, conviene cambiar a un proveedor de tiles (MapTiler, Stadia, Carto); la [política de uso de OSM](https://operations.osmfoundation.org/policies/tiles/) no permite uso intensivo.

---

## Publicar en Hostinger (GitHub Actions)

El workflow `.github/workflows/publicar.yml` corre:
- **cada día a las 20:00 (CDMX):** baja precios nuevos, guarda el histórico en el repo y publica;
- **en cada `git push` a `main`:** publica tus cambios con los datos que ya están en el repo;
- **a mano:** pestaña *Actions → Publicar sitio → Run workflow*.

### Configuración (una sola vez)

1. **Hostinger:** en hPanel → *Avanzado → Acceso SSH*, activa SSH y anota host, puerto (normalmente `65002`) y usuario.
2. **Llave SSH para el deploy** (en tu computadora):
   ```bash
   ssh-keygen -t ed25519 -C "deploy-sacacuentas" -f ~/.ssh/sacacuentas_deploy -N ""
   cat ~/.ssh/sacacuentas_deploy.pub    # pega esto en hPanel → Acceso SSH → Llaves SSH
   ```
3. **GitHub → Settings → Secrets and variables → Actions → New repository secret:**

   | Secret | Ejemplo |
   |---|---|
   | `SSH_HOST` | `123.45.67.89` |
   | `SSH_PORT` | `65002` |
   | `SSH_USER` | `u123456789` |
   | `SSH_KEY` | contenido completo de `~/.ssh/sacacuentas_deploy` (la **privada**) |
   | `REMOTE_PATH` | `domains/sacacuentas.isai-dev.com/public_html/` (con `/` final) |

   Opcional: en *Variables*, `SITE_URL` si usas otro dominio.
4. **hPanel → Seguridad → SSL:** instala el certificado y activa *Forzar HTTPS*.
5. Corre el workflow a mano una vez y revisa el sitio.

⚠️ `rsync --delete` deja `REMOTE_PATH` **idéntico** a `dist/`: borra cualquier otro archivo que haya en esa carpeta. Usa una carpeta dedicada al sitio.

El `public/.htaccess` (se copia a `dist/`) redirige `/aguinaldo` → `/aguinaldo/`, quita `www`, muestra el 404 propio y configura caché.

**Costo:** en un repo privado, cada corrida toma ~3–5 min; entra holgado en los 2,000 min gratis al mes. En un repo público es gratis sin límite.

---

## Alternativa: VPS con Docker + Nginx Proxy Manager

```bash
docker network create npm_proxy    # una vez; o usa la red de tu NPM y ponla en PROXY_NETWORK
cp .env.example .env
docker compose up -d --build       # corre pruebas, construye y sirve con Nginx
```

En NPM: Forward Hostname `sacacuentas-web`, puerto `80`, SSL con Let's Encrypt. Para datos diarios en el VPS, programa un cron que haga `git pull && docker compose up -d --build` después de que corra el workflow.
