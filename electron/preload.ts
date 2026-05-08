import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronApp', {
  getVersion: () => ipcRenderer.invoke('app:version'),
})
