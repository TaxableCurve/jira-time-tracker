# Jira Time Tracker — Plan de Desarrollo

App personal para registrar tiempo en Jira con vista de calendario interactivo, timer en vivo y reportes.

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend + API | Next.js 14 (App Router) |
| Estilos | Tailwind CSS + shadcn/ui |
| Calendario | `@fullcalendar/react` |
| Auth | API Token personal de Atlassian |
| Integración Jira | Jira REST API v3 |
| Estado / Cache | React Query (TanStack Query) |
| Deploy futuro | Vercel |

> Sin backend separado en el MVP — Next.js API Routes actúan como proxy a Jira API para no exponer el token al browser.

---

## Autenticación

Se usa **API Token personal** en lugar de OAuth 2.0, dado que:
- La app es solo para uso personal
- El sitio de Jira empresarial tiene bloqueadas las autorizaciones OAuth de terceros
- El API Token tiene los mismos permisos que el usuario, sin restricciones adicionales

### Cómo se guarda el token
El usuario ingresa su **Jira URL** (ej: `empresa.atlassian.net`) y su **API Token** en una pantalla de configuración inicial. Se guarda en:
- `localStorage` para la sesión del browser (solo modo local)
- Variables de entorno (`.env.local`) para desarrollo

Las llamadas a Jira **nunca salen del servidor** — Next.js API Routes reciben la petición del cliente, agregan el token, y hacen la llamada a Jira.

### Cabecera de autenticación
```
Authorization: Basic base64("email:api_token")
Content-Type: application/json
```

---

## Estructura del Proyecto

```
jira-time-tracker/
├── app/
│   ├── setup/               # Pantalla inicial: ingresar Jira URL + API Token
│   ├── (app)/
│   │   ├── calendar/        # Vista principal con calendario
│   │   ├── reports/         # Reportes de horas
│   │   └── layout.tsx       # Layout con sidebar de issues + timer global
│   └── api/
│       └── jira/
│           ├── issues/      # GET issues asignados al usuario
│           ├── worklogs/    # GET y POST worklogs
│           └── projects/    # GET proyectos accesibles
├── components/
│   ├── calendar/
│   │   ├── WeekView.tsx
│   │   ├── MonthView.tsx
│   │   └── WorklogBlock.tsx # Bloque de tiempo en el calendario
│   ├── timer/
│   │   ├── TimerBar.tsx     # Timer global en el header
│   │   └── TimerControls.tsx
│   ├── issue-panel/
│   │   ├── IssueList.tsx    # Lista de issues filtrable
│   │   └── IssueCard.tsx
│   └── reports/
│       ├── HoursByProject.tsx
│       └── HoursByDay.tsx
├── lib/
│   ├── jira.ts              # Cliente Jira API (server-side)
│   └── format.ts            # Helpers de tiempo (segundos ↔ horas)
└── store/
    └── timer.ts             # Estado global del timer (Zustand)
```

---

## Fases de Desarrollo

### ✅ Fase 0 — Setup inicial
- [x] Crear proyecto Next.js: `npx create-next-app@latest jira-time-tracker`
- [x] Instalar dependencias: Tailwind, shadcn/ui, React Query, Zustand, FullCalendar
- [x] Pantalla de configuración: formulario para ingresar Jira URL + email + API Token
- [x] Guardar config en localStorage
- [x] API Route de prueba: `POST /api/jira/validate` → valida token llamando a `/rest/api/3/myself`
- [x] Redirect automático a `/setup` si no hay token configurado

### ✅ Fase 1 — Issues y Worklogs
- [x] `POST /api/jira/search/jql` — buscar issues asignados (migrado de `/search` deprecado)
- [x] `GET /api/jira/projects` — listar proyectos accesibles
- [x] `GET /api/jira/worklogs` — obtener worklogs de un issue
- [x] `POST /api/jira/worklogs` — crear worklog en un issue
- [x] Panel lateral con lista de issues, filtrable por texto y proyecto
- [x] Cada issue muestra: clave, título, proyecto, estado, tiempo loggeado vs estimado
- [x] Timer global en barra superior — registra worklog en Jira al detener

### ✅ Fase 2 — Calendario interactivo
- [x] Instalar y configurar FullCalendar con plugin de React y drag & drop
- [x] Vista semanal: bloques de tiempo por hora, coloreados por proyecto
- [x] Vista mensual: resumen de worklogs por día
- [x] Drag para crear nuevo bloque → popup para seleccionar issue de la lista
- [x] Al confirmar → `POST /api/jira/worklogs` y el bloque aparece en el calendario
- [x] Sincronización al cargar: leer worklogs reales de Jira para el período visible
- [x] Fix: migrar `/search` → `/search/jql` (API deprecada)
- [x] Fix: worklogs se obtienen por issue individualmente (campo inline no soportado)
- [x] Fix: timer muestra MM:SS con segundos en vivo, mínimo 60s para Jira

### ✅ Fase 2.5 — Edición de worklogs y vista mensual
- [x] Click en bloque existente → popup con detalle (issue, hora, duración)
- [x] Editar duración y hora de inicio desde el popup
- [x] Eliminar worklog desde el popup con confirmación → `DELETE /api/jira/worklogs/:issueKey/:worklogId`
- [x] Arrastrar bloque existente para cambiar hora/día → actualiza worklog en Jira
- [x] Resize del bloque para cambiar duración → actualiza worklog en Jira
- [x] Vista mensual mejorada: número del día + pill ámbar con total de horas por día
- [x] Fix: Jira DELETE devuelve 204 No Content, manejo de body vacío

### ✅ Fase 3 — Timer en vivo
- [x] Estado global del timer con Zustand: `{ issueKey, issueName, startTime, isRunning }`
- [x] Botón "Iniciar timer" en cada IssueCard del panel lateral
- [x] TimerBar en el header: muestra issue activo + tiempo transcurrido en vivo (MM:SS)
- [x] Botón "Detener" → calcula duración → `POST /api/jira/worklogs` → aparece en calendario
- [x] El timer persiste si navegas entre páginas
- [x] Solo un timer activo a la vez
- [x] Mínimo 60s requerido por Jira

### ✅ Fase 4 — Reportes
- [x] Filtros: esta semana, semana pasada, este mes, mes pasado, rango personalizado
- [x] Cards resumen: total horas, días trabajados, top task, cantidad de tareas
- [x] Donut por sub-task: top 8 tareas con horas, resto agrupado como "Others"
- [x] Heatmap de calendario: días coloreados por intensidad de horas, hover con desglose
- [x] Navegación Calendar / Reports en el header
- [x] Agrupación por sub-task en lugar de por proyecto

### 🔲 Fase 5 — Deploy a Vercel
- [ ] Mover config (Jira URL, email, token) a variables de entorno de Vercel
- [ ] Agregar pantalla de settings para cambiar credenciales sin tocar `.env`
- [ ] Verificar que todas las API Routes funcionen en producción
- [ ] Deploy: `vercel --prod`

---

## Endpoints Jira API que se usan

| Método | Endpoint | Uso |
|--------|----------|-----|
| GET | `/rest/api/3/myself` | Validar token y obtener accountId |
| GET | `/rest/api/3/search?jql=...` | Listar issues asignados |
| GET | `/rest/api/3/project` | Listar proyectos |
| GET | `/rest/api/3/issue/{issueId}/worklog` | Leer worklogs de un issue |
| POST | `/rest/api/3/issue/{issueId}/worklog` | Crear worklog |
| DELETE | `/rest/api/3/issue/{issueId}/worklog/{worklogId}` | Eliminar worklog |

### Formato de worklog para crear
```json
{
  "timeSpentSeconds": 3600,
  "started": "2024-04-29T10:00:00.000+0000",
  "comment": {
    "type": "doc",
    "version": 1,
    "content": []
  }
}
```

---

## Notas importantes

- **Tiempo en Jira:** La API maneja tiempo en **segundos**. La UI muestra horas/minutos. Usar helpers en `lib/format.ts` para convertir.
- **accountId vs username:** La API v3 de Jira usa `accountId` (no username). Se obtiene del endpoint `/rest/api/3/myself` al iniciar.
- **Worklogs por rango:** Jira no tiene endpoint directo para "mis worklogs del mes". Hay que iterar por issues o usar el endpoint `GET /rest/api/3/issue/{id}/worklog` por issue. Alternativa: guardar worklogs localmente en `localStorage` como caché.
- **Rate limiting:** Jira Cloud tiene rate limit. No hacer polling agresivo, usar React Query con `staleTime` adecuado.
- **Estimaciones opcionales:** Si un issue no tiene estimación (`originalEstimateSeconds: null`), la UI omite la comparativa sin errores.

---

## Comandos para arrancar

```bash
npx create-next-app@latest jira-time-tracker --typescript --tailwind --app
cd jira-time-tracker
npx shadcn@latest init

# Dependencias principales
npm install @tanstack/react-query zustand
npm install @fullcalendar/react @fullcalendar/daygrid @fullcalendar/timegrid @fullcalendar/interaction
npm install recharts
npm install date-fns
```

---

## Estado actual

> **Última actualización:** Fase 4 completada ✅
>
> Próximo paso: Fase 5 — deploy a Vercel.
