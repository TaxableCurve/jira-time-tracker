import { autoUpdater } from 'electron-updater'
import { dialog } from 'electron'

export function initUpdater() {
  autoUpdater.checkForUpdatesAndNotify()

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
