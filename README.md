# Jira Time Tracker

App personal para registrar tiempo en Jira con vista de calendario interactivo, timer en vivo y reportes.

## Features

- **Calendario interactivo** — vistas semanal y mensual con bloques de tiempo coloreados por proyecto
- **Timer en vivo** — inicia/detiene desde cualquier issue; registra el worklog en Jira automáticamente
- **Panel lateral de issues** — lista filtrable por texto y proyecto con tiempo loggeado vs estimado
- **Drag & drop** — crea, mueve y redimensiona bloques de tiempo directamente en el calendario
- **Reportes** — resumen de horas por período con donut chart por tarea y heatmap de actividad
- **Proxy seguro** — las credenciales nunca salen del servidor (Next.js API Routes)

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend + API | Next.js 14 (App Router) |
| Estilos | Tailwind CSS + shadcn/ui |
| Calendario | FullCalendar (React) |
| Charts | Recharts |
| Estado / Cache | TanStack Query + Zustand |
| Auth | API Token personal de Atlassian |
| Integración | Jira REST API v3 |

## Autenticación

Se usa **API Token personal** de Atlassian. Al abrir la app por primera vez, se muestra una pantalla de configuración donde se ingresa:

- **Jira URL** — ej: `empresa.atlassian.net`
- **Email** — correo de la cuenta de Atlassian
- **API Token** — generado en [id.atlassian.com/manage-profile/security/api-tokens](https://id.atlassian.com/manage-profile/security/api-tokens)

Las credenciales se guardan en `localStorage`. Las llamadas a Jira **siempre pasan por el servidor** — el token nunca queda expuesto en el browser.

## Estructura del proyecto

```
app/
├── setup/               # Pantalla inicial de configuración
├── (app)/
│   ├── calendar/        # Vista principal con calendario
│   ├── reports/         # Reportes de horas
│   └── layout.tsx       # Layout con sidebar de issues + timer global
└── api/jira/
    ├── validate/        # Valida token contra /rest/api/3/myself
    ├── search/jql/      # Busca issues asignados
    ├── projects/        # Lista proyectos accesibles
    └── worklogs/        # CRUD de worklogs

components/
├── calendar/            # WeekView, MonthView, WorklogBlock
├── timer/               # TimerBar, TimerControls
├── issue-panel/         # IssueList, IssueCard
└── reports/             # HoursByProject, HeatmapCalendar

lib/
├── jira.ts              # Cliente Jira API (server-side)
└── format.ts            # Helpers segundos ↔ horas

store/
└── timer.ts             # Estado global del timer (Zustand)
```

## Requisitos

- Node.js 18+
- Cuenta de Atlassian con acceso a un sitio Jira Cloud
- API Token de Atlassian

## Instalación y desarrollo

```bash
npm install
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000). La app redirige a `/setup` si no hay credenciales configuradas.

## Docker

```bash
docker compose up
```

La app queda disponible en [http://localhost:3000](http://localhost:3000).

## Endpoints Jira utilizados

| Método | Endpoint | Uso |
|--------|----------|-----|
| GET | `/rest/api/3/myself` | Validar token y obtener accountId |
| POST | `/rest/api/3/search/jql` | Listar issues asignados |
| GET | `/rest/api/3/project` | Listar proyectos |
| GET | `/rest/api/3/issue/{id}/worklog` | Leer worklogs de un issue |
| POST | `/rest/api/3/issue/{id}/worklog` | Crear worklog |
| PUT | `/rest/api/3/issue/{id}/worklog/{worklogId}` | Actualizar worklog |
| DELETE | `/rest/api/3/issue/{id}/worklog/{worklogId}` | Eliminar worklog |
