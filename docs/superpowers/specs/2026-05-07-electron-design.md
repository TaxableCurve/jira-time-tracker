# Spec: Electron Desktop App

**Fecha:** 2026-05-07
**Versión base:** 1.5.0
**Enfoque:** Opción A — Next.js como servidor embebido

## Objetivo

Convertir la app Next.js en una aplicación de escritorio instalable distribuida vía GitHub Releases, con actualizaciones automáticas, para Windows, macOS y Linux.

---

## Arquitectura

### Enfoque seleccionado: Next.js embebido

El Main Process de Electron levanta el servidor Next.js en un puerto libre en localhost. La ventana (BrowserWindow) carga esa URL. Las API Routes de Next.js siguen funcionando exactamente igual — sin cambios al código existente de la app.

```
Electron Main Process (Node.js)
├── lanza: next start --port {puerto libre}
├── espera health check en http://localhost:{puerto}/api/health
├── crea BrowserWindow → carga http://localhost:{puerto}
├── registra electron-updater → chequea GitHub Releases al iniciar
└── al cerrar ventana: mata proceso Next.js, termina app
```

### Por qué este enfoque

- Cambios mínimos al código existente de Next.js
- Las API Routes siguen actuando como proxy a Jira (el token nunca sale al renderer)
- Curva de aprendizaje gradual: se entiende Electron sin refactorizar la app
- Ruta de migración clara hacia Opción B (IPC nativo) en el futuro

---

## Estructura de archivos

Archivos nuevos marcados con `←`:

```
jira-time-tracker/
├── electron/                    ←
│   ├── main.ts                  ← entry point de Electron
│   ├── preload.ts               ← bridge contextBridge (aislado)
│   └── updater.ts               ← lógica de auto-update
├── resources/
│   └── icon.png                 ← ícono 1024×1024 (electron-builder genera .ico/.icns)
├── .github/
│   └── workflows/
│       └── release.yml          ← CI build + publish en cada tag v*
├── app/                         sin cambios
├── components/                  sin cambios
├── next.config.ts               ajuste: PORT dinámico via variable de entorno
├── tsconfig.electron.json       ← tsconfig separado para compilar electron/
└── package.json                 nuevos scripts + sección "build" de electron-builder
```

---

## Dependencias

### Runtime (dependencies)
| Paquete | Propósito |
|---------|-----------|
| `electron` | Runtime de escritorio |
| `electron-updater` | Auto-updates desde GitHub Releases |

### Build (devDependencies)
| Paquete | Propósito |
|---------|-----------|
| `electron-builder` | Empaquetado e instaladores multiplataforma |
| `concurrently` | Correr Next.js + Electron en paralelo en dev |
| `wait-on` | Esperar a que Next.js esté listo antes de abrir Electron |
| `ts-node` | Ejecutar `electron/main.ts` sin compilar en dev |

---

## Scripts npm

```json
"electron:dev":   "concurrently \"next dev\" \"wait-on http://localhost:3000 && electron .\"",
"electron:build": "next build && tsc -p tsconfig.electron.json && electron-builder",
"electron:dist":  "next build && tsc -p tsconfig.electron.json && electron-builder --publish always"
```

- `electron:dev` — desarrollo local, hot-reload de Next.js activo
- `electron:build` — genera instaladores localmente sin publicar
- `electron:dist` — genera instaladores y los sube a GitHub Release (usado por CI)

---

## electron/main.ts — comportamiento

1. Detectar si es desarrollo (`process.env.NODE_ENV === 'development'`) o producción
2. En **producción**: encontrar un puerto libre, lanzar `next start --port {puerto}` apuntando al build standalone empaquetado
3. En **desarrollo**: asumir que Next.js ya corre en `:3000` (levantado por `concurrently`)
4. Hacer polling a `http://localhost:{puerto}/api/health` hasta recibir 200 (timeout: 30s)
5. Crear `BrowserWindow` con:
   - `width: 1280, height: 800`
   - `minWidth: 900, minHeight: 600`
   - `webPreferences: { preload, contextIsolation: true, nodeIntegration: false }`
6. Cargar la URL de Next.js
7. Inicializar `electron-updater` (ver sección Auto-updates)
8. En evento `window-all-closed`: matar proceso Next.js y llamar `app.quit()`

---

## electron/preload.ts — comportamiento

Expone una API mínima al renderer vía `contextBridge`:

```ts
contextBridge.exposeInMainWorld('electronApp', {
  getVersion: () => ipcRenderer.invoke('app:version'),
})
```

Por ahora solo la versión de la app. La app Next.js no necesita acceso nativo adicional — todas las llamadas a Jira van por las API Routes.

---

## electron/updater.ts — comportamiento

- Usar `autoUpdater` de `electron-updater`
- Al iniciar la app, llamar `autoUpdater.checkForUpdatesAndNotify()`
- Notificación nativa del OS cuando hay actualización disponible
- Descarga en background; instalación al cerrar la app
- En desarrollo (`isDev`): deshabilitar actualizaciones completamente

---

## Empaquetado — electron-builder

Configuración en `package.json` bajo clave `"build"`:

```json
{
  "appId": "com.taxablecurve.jira-time-tracker",
  "productName": "Jira Time Tracker",
  "icon": "resources/icon.png",
  "publish": {
    "provider": "github",
    "owner": "TaxableCurve",
    "repo": "jira-time-tracker"
  },
  "win": {
    "target": ["nsis", "portable"]
  },
  "mac": {
    "target": [{ "target": "dmg", "arch": ["x64", "arm64"] }]
  },
  "linux": {
    "target": ["AppImage", "deb"]
  },
  "files": [
    ".next/standalone/**",
    ".next/static/**",
    "public/**",
    "electron/dist/**"
  ],
  "extraMetadata": {
    "main": "electron/dist/main.js"
  }
}
```

### Plataformas y artefactos generados

| Plataforma | Artefactos |
|------------|-----------|
| Windows | `Jira Time Tracker Setup.exe` (NSIS) + `Jira Time Tracker.exe` (portable) |
| macOS | `Jira Time Tracker.dmg` (universal: x64 + arm64) |
| Linux | `Jira Time Tracker.AppImage` + `.deb` |

---

## CI/CD — GitHub Actions

Archivo: `.github/workflows/release.yml`

**Trigger:** push de tag `v*` (ej: `v1.6.0`)

**Jobs en paralelo:**
- `build-windows` — runner `windows-latest`
- `build-macos` — runner `macos-latest`
- `build-linux` — runner `ubuntu-latest`

**Cada job:**
1. Checkout del repo
2. `npm ci`
3. `npm run electron:dist` (publica automáticamente a GitHub Release)

**Secrets requeridos en el repositorio:**
- `GH_TOKEN` — token de GitHub con permisos de escritura en releases (ya disponible como `secrets.GITHUB_TOKEN` en Actions)
- `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID` — solo para notarización macOS (opcional en primera versión)

---

## Flujo de release para el autor

```bash
# 1. Bumper versión (actualiza package.json + crea tag)
npm run release:minor   # → v1.6.0

# 2. GitHub Actions toma el tag, buildea en 3 plataformas, publica Release
# 3. Usuarios con la app abierta reciben notificación de update automáticamente
```

---

## Ícono de la app

Electron-builder genera `.ico` (Windows) e `.icns` (macOS) a partir de un único `resources/icon.png` de 1024×1024 px.

**Nota:** El favicon del browser (`public/favicon.ico`) es independiente del ícono de la app de escritorio. Ambos deben actualizarse para reflejar el tema cyan. Ver tarea pendiente: actualizar favicon.

---

## Cambios al código existente

| Archivo | Cambio |
|---------|--------|
| `next.config.ts` | Leer `PORT` de variable de entorno en lugar de hardcodear |
| `package.json` | Añadir dependencias, scripts y sección `"build"` de electron-builder |
| `.gitignore` | Añadir `dist/`, `electron/dist/`, `.superpowers/` |

El código de la app (`app/`, `components/`, `lib/`, `store/`) no se toca.

---

## Lo que esta fase NO incluye

- Migración a IPC nativo (Opción B) — queda para una fase futura
- Notarización de macOS — opcional, se puede añadir después
- Auto-launch al inicio del sistema operativo
- Tray icon / minimizar a bandeja
