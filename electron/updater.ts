import { autoUpdater } from 'electron-updater'
import { dialog } from 'electron'

export function initUpdater() {
  autoUpdater.on('error', (err) => {
    console.log(`[updater] check failed: ${err.message}`)
  })

  autoUpdater.checkForUpdatesAndNotify().catch((err) => {
    console.log(`[updater] check failed: ${err.message}`)
  })

  autoUpdater.on('update-downloaded', (info) => {
    dialog
      .showMessageBox({
        type: 'info',
        title: 'Update ready',
        message: `Version ${info.version} is ready. Restart to apply?`,
        buttons: ['Restart', 'Later'],
      })
      .then(({ response }) => {
        if (response === 0) autoUpdater.quitAndInstall()
      })
  })
}
