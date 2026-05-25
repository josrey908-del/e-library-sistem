# E-Library Stream — Resumen de mejoras

## Fase 1 — Portadas originales

### Qué se hizo
- Módulo **`lib/cover-resolver.ts`**: resuelve portadas con prioridad Gutenberg → Open Library → Google Books.
- Caché en **`data/cover-cache.json`** (gitignored), manifest en **`lib/covers-manifest.json`**.
- Portadas descargadas localmente en **`public/covers/`** para mayor fiabilidad.
- Script **`npm run covers:fix`** actualiza la base de datos y el manifest.

### API keys (opcional)
Copia `.env.example` a `.env` y añade:

```env
GOOGLE_BOOKS_API_KEY=tu_clave_aqui
```

Obtén la clave en [Google Cloud Console — Books API](https://console.cloud.google.com/apis/library/books.googleapis.com).

Sin clave, el sistema usa Open Library y Gutenberg (suficiente para la mayoría de clásicos).

### Comandos
```bash
npm run covers:assign      # asigna portadas libro por libro
npm run covers:reassign    # fuerza reasignación de las 100 portadas
npm run covers:fix         # actualización rápida en lotes
```

Cada portada se guarda como `public/covers/{sourceId}.jpg` y se registra en `lib/covers-manifest.json` — **un archivo único por libro**, sin mezclar títulos.

Informe detallado: `data/cover-assign-report.json` (título, autor, fuente, puntuación de coincidencia).

---

## Fase 2 — Catálogo ampliado

### Qué se hizo
- Campos nuevos en Prisma: `isbn`, `pdfUrl`, `pdfStatus` (`ready` | `epub_only` | `coming_soon`).
- Cliente **Gutendex** en `lib/gutendex.ts`.
- Importador masivo: **`npm run db:import`** (objetivo: al menos 50 libros EN + 50 ES desde Gutendex).
- Setup completo: **`npm run db:setup`** (schema + seed clásicos + importación Gutendex).

### Comandos
```bash
npm run db:push          # aplicar schema
npm run db:seed          # usuarios + catálogo curado (works-catalog)
npm run db:import        # +50 EN y +50 ES desde Gutendex (si faltan)
npm run covers:fix       # portadas para todo el catálogo
npm run db:setup         # push + seed + import en un paso
```

### Administración
- Panel en **`/admin`**: listar, buscar, editar y eliminar libros.
- API: `GET/POST /api/admin/books`, `PATCH/DELETE /api/admin/books/[id]`.

---

## Fase 3 — Responsividad móvil

### Qué se hizo
- **Navbar**: menú hamburguesa con drawer, búsqueda adaptable, áreas táctiles ≥ 44px.
- **Hero**: altura flexible en móvil, botones apilados, portada lateral oculta en pantallas muy pequeñas.
- **BookCard / Carousel**: hover solo en desktop; gestos táctiles; flechas visibles en móvil.
- **Búsqueda**: rejilla `book-grid` auto-ajustable.
- **Detalle de libro** y **lector EPUB**: barras y sidebars adaptados a pantallas estrechas.
- **CSS global**: `.touch-target`, safe areas, utilidades mobile-first.

### Viewports recomendados para probar
320px, 375px, 768px, 1024px (DevTools → modo dispositivo).

---

## Fase 4 — Verificación

| Criterio | Estado |
|----------|--------|
| Módulo de portadas con caché y reintentos | ✅ |
| Script de corrección masiva | ✅ |
| Importación ≥ 100 libros (50 ES + 50 EN) | ✅ (vía `db:import`) |
| Panel admin | ✅ (existente, mejorado schema) |
| Diseño responsive | ✅ |
| PDF descargable | ✅ EPUB→PDF; PDF directo si `pdfUrl` |

---

## Mejoras pendientes (opcional)

- Proteger `/admin` con autenticación de rol.
- Lazy-loading explícito en imágenes del catálogo (`loading="lazy"` en cards).
- CDN para `public/covers` en producción.
- Importación incremental sin duplicar `sourceId`.
- Valorar PostgreSQL si el catálogo supera varios miles de títulos.

---

## Puesta en marcha rápida

```bash
cd e-library-stream
npm install
cp .env.example .env
npm run db:setup
npm run covers:fix
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).
