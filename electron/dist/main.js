"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const child_process_1 = require("child_process");
const path = __importStar(require("path"));
const net = __importStar(require("net"));
const http = __importStar(require("http"));
const updater_1 = require("./updater");
const isDev = process.env.NODE_ENV === 'development';
let nextServer = null;
let mainWindow = null;
let currentPort = 0;
function findFreePort() {
    return new Promise((resolve, reject) => {
        const server = net.createServer();
        server.listen(0, '127.0.0.1', () => {
            const addr = server.address();
            server.close(() => resolve(addr.port));
        });
        server.on('error', reject);
    });
}
function waitForServer(url, timeoutMs = 30000) {
    return new Promise((resolve, reject) => {
        const deadline = Date.now() + timeoutMs;
        const attempt = () => {
            http.get(url, (res) => {
                if (res.statusCode === 200) {
                    resolve();
                }
                else {
                    retry();
                }
                res.resume();
            }).on('error', retry);
        };
        const retry = () => {
            if (Date.now() >= deadline) {
                reject(new Error(`Next.js server did not start within ${timeoutMs}ms`));
                return;
            }
            setTimeout(attempt, 500);
        };
        attempt();
    });
}
async function startNextServer() {
    if (isDev) {
        // In dev, Next.js is already running via `concurrently` in electron:dev
        currentPort = 3000;
        return 3000;
    }
    const port = await findFreePort();
    const serverPath = path.join(electron_1.app.getAppPath(), '.next', 'standalone', 'server.js');
    nextServer = (0, child_process_1.spawn)(process.execPath, [serverPath], {
        env: {
            ...process.env,
            ELECTRON_RUN_AS_NODE: '1',
            PORT: String(port),
            HOSTNAME: '127.0.0.1',
            NODE_ENV: 'production',
        },
        stdio: 'pipe',
    });
    nextServer.stdout?.on('data', (d) => process.stdout.write(`[next] ${d}`));
    nextServer.stderr?.on('data', (d) => process.stderr.write(`[next] ${d}`));
    nextServer.on('exit', (code) => console.log(`[next] exited with code ${code}`));
    await waitForServer(`http://127.0.0.1:${port}/api/health`);
    currentPort = port;
    return port;
}
function createWindow(port) {
    mainWindow = new electron_1.BrowserWindow({
        width: 1280,
        height: 800,
        minWidth: 900,
        minHeight: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });
    mainWindow.loadURL(`http://127.0.0.1:${port}`);
    mainWindow.on('closed', () => { mainWindow = null; });
}
electron_1.app.whenReady().then(async () => {
    electron_1.ipcMain.handle('app:version', () => electron_1.app.getVersion());
    try {
        const port = await startNextServer();
        createWindow(port);
        if (!isDev)
            (0, updater_1.initUpdater)();
    }
    catch (err) {
        console.error('Failed to start:', err);
        electron_1.app.quit();
    }
});
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        nextServer?.kill();
        electron_1.app.quit();
    }
});
// macOS: re-open window when clicking dock icon with no windows open
electron_1.app.on('activate', () => {
    if (mainWindow === null) {
        if (currentPort !== 0) {
            createWindow(currentPort);
        }
        else {
            startNextServer().then(createWindow).catch(() => electron_1.app.quit());
        }
    }
});
