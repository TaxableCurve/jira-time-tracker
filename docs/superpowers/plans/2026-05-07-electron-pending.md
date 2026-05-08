# Electron — Tareas Pendientes

> Estado al 2026-05-07. Referencia completa: `docs/superpowers/plans/2026-05-07-electron.md`

---

## ⚠️ Antes de cualquier push

Los commits de Electron están en `main` local sin push. Deben moverse a una rama feature antes de subir:

```bash
# Crear rama desde el commit anterior a los cambios de Electron
git checkout -b feat/electron 3ce1494

# Traer todos los commits de Electron
git cherry-pick 13aad02..18111b2

# Volver a main y dejarlo limpio (opcional, para no tener los commits en los dos lados)
# git checkout main && git reset --hard 3ce1494
```

---

## Tareas pendientes

### Task 9: Test dev mode (manual — requiere GUI)

Ejecutar en tu máquina:

```bash
npm run electron:dev
```

Verificar:
- [ ] Se abre una ventana nativa con la app
- [ ] La navegación Calendar / Reports funciona
- [ ] En DevTools: `await window.electronApp.getVersion()` retorna `"1.5.0"`
- [ ] Al cerrar la ventana, el proceso termina limpiamente

---

### Task 10: Test production build (manual — tarda ~5 min)

```bash
npm run electron:build
```

Verificar:
- [ ] Termina sin errores
- [ ] Existen archivos en `dist/`:
  ```bash
  ls dist/
  # esperado: *.AppImage y *.deb en Linux
  ```
- [ ] Ejecutar el AppImage y confirmar que la app abre y funciona end-to-end

---

### Task 11: GitHub Actions release workflow ✅

Ya creado en `.github/workflows/release.yml`. Se activa automáticamente al hacer push de un tag `v*`.

---

### Task 12: First release (después de verificar Tasks 9 y 10)

```bash
# 1. Asegurarse de estar en feat/electron con todo commiteado
git status

# 2. Abrir PR a main en GitHub o hacer merge directo

# 3. Una vez en main, crear el tag de release
npm run release:minor
# → bumps a v1.6.0, crea tag, hace push del tag
# → GitHub Actions buildea en 3 plataformas y publica Release automáticamente

# 4. Verificar en:
# https://github.com/TaxableCurve/jira-time-tracker/actions  (builds corriendo)
# https://github.com/TaxableCurve/jira-time-tracker/releases (release publicado)
```

Artefactos esperados en el Release:
| Plataforma | Archivos |
|------------|---------|
| Windows | `Jira Time Tracker Setup 1.6.0.exe` + portable |
| macOS | `Jira Time Tracker-1.6.0.dmg` |
| Linux | `Jira Time Tracker-1.6.0.AppImage` + `.deb` |
| Updater | `latest.yml`, `latest-mac.yml`, `latest-linux.yml` |
