import { app, BrowserWindow, ipcMain } from 'electron'
import { spawn, ChildProcess } from 'child_process'
import * as path from 'path'
import * as net from 'net'
import * as http from 'http'
import { initUpdater } from './updater'

const isDev = process.env.NODE_ENV === 'development'
let nextServer: ChildProcess | null = null
let mainWindow: BrowserWindow | null = null
let currentPort: number = 0

function findFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer()
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address() as net.AddressInfo
      server.close(() => resolve(addr.port))
    })
    server.on('error', reject)
  })
}

function waitForServer(url: string, timeoutMs = 30_000): Promise<void> {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + timeoutMs
    const attempt = () => {
      http.get(url, (res) => {
        if (res.statusCode === 200) {
          resolve()
        } else {
          retry()
        }
        res.resume()
      }).on('error', retry)
    }
    const retry = () => {
      if (Date.now() >= deadline) {
        reject(new Error(`Next.js server did not start within ${timeoutMs}ms`))
        return
      }
      setTimeout(attempt, 500)
    }
    attempt()
  })
}

async function startNextServer(): Promise<number> {
  if (isDev) {
    // In dev, Next.js is already running via `concurrently` in electron:dev
    currentPort = 3000
    return 3000
  }

  const port = await findFreePort()
  const serverPath = path.join(app.getAppPath(), '.next', 'standalone', 'server.js')

  const standaloneDir = path.join(app.getAppPath(), '.next', 'standalone')

  nextServer = spawn(process.execPath, [serverPath], {
    cwd: standaloneDir,
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: '1',
      PORT: String(port),
      HOSTNAME: '127.0.0.1',
      NODE_ENV: 'production',
    },
    stdio: 'pipe',
  })

  nextServer.stdout?.on('data', (d) => process.stdout.write(`[next] ${d}`))
  nextServer.stderr?.on('data', (d) => process.stderr.write(`[next] ${d}`))
  nextServer.on('exit', (code) => console.log(`[next] exited with code ${code}`))

  await waitForServer(`http://127.0.0.1:${port}/api/health`)
  currentPort = port
  return port
}

function createWindow(port: number): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  mainWindow.loadURL(`http://127.0.0.1:${port}`)
  mainWindow.on('closed', () => { mainWindow = null })
}

app.whenReady().then(async () => {
  ipcMain.handle('app:version', () => app.getVersion())

  try {
    const port = await startNextServer()
    createWindow(port)
    if (!isDev) initUpdater()
  } catch (err) {
    console.error('Failed to start:', err)
    app.quit()
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    nextServer?.kill()
    app.quit()
  }
})

// macOS: re-open window when clicking dock icon with no windows open
app.on('activate', () => {
  if (mainWindow === null) {
    if (currentPort !== 0) {
      createWindow(currentPort)
    } else {
      startNextServer().then(createWindow).catch(() => app.quit())
    }
  }
})
