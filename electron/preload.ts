import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronApp', {
  getVersion: () => ipcRenderer.invoke('app:version'),
  config: {
    get: (): Promise<string | null> => ipcRenderer.invoke('config:get'),
    set: (data: string): Promise<void> => ipcRenderer.invoke('config:set', data),
    clear: (): Promise<void> => ipcRenderer.invoke('config:clear'),
  },
})
