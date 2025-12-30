import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import { join } from 'path';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import os from 'os';

// Fix PATH on macOS for packaged apps to find 'svn'
if (process.platform === 'darwin') {
  const paths = [
    '/opt/homebrew/bin',
    '/usr/local/bin',
    '/usr/bin',
    '/bin',
    '/usr/sbin',
    '/sbin',
    process.env.PATH
  ];
  process.env.PATH = paths.join(':');
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const execAsync = promisify(exec);

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    titleBarStyle: 'hiddenInset', // Mac-like feel
    vibrancy: 'under-window', // Mac blur effect
    visualEffectState: 'active',
  });

  const startUrl = process.env.ELECTRON_START_URL || 'http://localhost:5173';

  // In production, load the local file
  if (!process.env.ELECTRON_START_URL && app.isPackaged) {
    mainWindow.loadFile(join(__dirname, '../dist/index.html'));
  } else {
    mainWindow.loadURL(startUrl);
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// --- IPC Handlers ---

// SVN List
ipcMain.handle('svn-list', async (event, { url, username, password }) => {
  try {
    // Use comprehensive trust flags for self-signed/IP-based certs
    // --trust-server-cert-failures=unknown-ca,cn-mismatch,expired,not-yet-valid,other
    let cmd = `svn list --xml --non-interactive --trust-server-cert-failures=unknown-ca,cn-mismatch,expired,not-yet-valid,other "${url}"`;
    if (username && password) {
      cmd += ` --username "${username}" --password "${password}" --no-auth-cache`;
    }

    // Ensure UTF-8 output
    const { stdout } = await execAsync(cmd, {
      env: { ...process.env, LANG: 'en_US.UTF-8', LC_ALL: 'en_US.UTF-8' },
      maxBuffer: 1024 * 1024 * 10
    });
    return { success: true, data: stdout };
  } catch (error) {
    console.error("SVN List Error:", error);
    return { success: false, error: error.message };
  }
});

// SVN Download (Export)
// Existing export for directories (simplified) or if progress not needed
ipcMain.handle('svn-download', async (event, { url, path: localPath, username, password }) => {
  try {
    let cmd = `svn export --force --non-interactive --trust-server-cert-failures=unknown-ca,cn-mismatch,expired,not-yet-valid,other "${url}" "${localPath}"`;
    if (username && password) {
      cmd += ` --username "${username}" --password "${password}" --no-auth-cache`;
    }
    await execAsync(cmd, {
      env: { ...process.env, LANG: 'en_US.UTF-8', LC_ALL: 'en_US.UTF-8' },
      maxBuffer: 1024 * 1024 * 10
    });
    return { success: true, path: localPath };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// New streaming download for single files
ipcMain.handle('svn-download-file', async (event, { url, path: localPath, username, password, size, id }) => {
  return new Promise((resolve, reject) => {
    // fs and spawn are now imported at the top

    const args = ['cat', '--non-interactive', '--trust-server-cert-failures=unknown-ca,cn-mismatch,expired,not-yet-valid,other', url];
    if (username && password) {
      args.push('--username', username, '--password', password, '--no-auth-cache');
    }

    const child = spawn('svn', args, {
      env: { ...process.env, LANG: 'en_US.UTF-8', LC_ALL: 'en_US.UTF-8' }
    });

    const fileStream = fs.createWriteStream(localPath);
    let downloaded = 0;

    child.stdout.on('data', (chunk) => {
      fileStream.write(chunk);
      downloaded += chunk.length;
      if (size > 0) {
        const progress = Math.min(100, Math.round((downloaded / size) * 100));
        // Send progress to renderer
        event.sender.send('download-progress', { id, progress, downloaded });
      }
    });

    child.stderr.on('data', (data) => {
      console.error(`SVN Error: ${data}`);
    });

    child.on('close', (code) => {
      fileStream.end();
      if (code === 0) {
        resolve({ success: true, path: localPath });
      } else {
        resolve({ success: false, error: `Process exited with code ${code}` });
      }
    });

    child.on('error', (err) => {
      fileStream.end();
      resolve({ success: false, error: err.message });
    });
  });
});

// SVN Import (Upload)
// SVN Import (Upload New File)
ipcMain.handle('svn-import', async (event, { localPath, remoteUrl, message, username, password }) => {
  try {
    const msg = message || "Uploaded via SVNC";
    let cmd = `svn import -m "${msg}" --force --non-interactive --trust-server-cert-failures=unknown-ca,cn-mismatch,expired,not-yet-valid,other "${localPath}" "${remoteUrl}"`;

    if (username && password) {
      cmd += ` --username "${username}" --password "${password}" --no-auth-cache`;
    }

    await execAsync(cmd, {
      env: { ...process.env, LANG: 'en_US.UTF-8', LC_ALL: 'en_US.UTF-8' }
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// SVN Update (Overwrite with History)
ipcMain.handle('svn-update', async (event, { localPath, remoteUrl, message, username, password }) => {
  try {
    // Strategy: Checkout parent (empty), update file, overwrite, commit.
    // 1. Setup paths

    const parentUrl = remoteUrl.split('/').slice(0, -1).join('/');
    const fileName = remoteUrl.split('/').pop();
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'svnc-update-'));

    // 2. Checkout parent (empty)
    let authArgs = '';
    if (username && password) {
      authArgs = ` --username "${username}" --password "${password}" --no-auth-cache`;
    }
    const commonFlags = `--non-interactive --trust-server-cert-failures=unknown-ca,cn-mismatch,expired,not-yet-valid,other`;

    await execAsync(`svn checkout --depth empty "${parentUrl}" "${tempDir}" ${commonFlags} ${authArgs}`, {
      env: { ...process.env, LANG: 'en_US.UTF-8', LC_ALL: 'en_US.UTF-8' }
    });

    // 3. Update specific file (bring it to working copy)
    // Note: If file doesn't exist in repo, this fails. But this handler is for OVERWRITE.
    await execAsync(`svn update "${fileName}" ${commonFlags} ${authArgs}`, {
      cwd: tempDir,
      env: { ...process.env, LANG: 'en_US.UTF-8', LC_ALL: 'en_US.UTF-8' }
    });

    // 4. Overwrite file
    fs.copyFileSync(localPath, path.join(tempDir, fileName));

    // 5. Commit
    const msg = message || "Updated via SVNC";
    await execAsync(`svn commit -m "${msg}" "${fileName}" ${commonFlags} ${authArgs}`, {
      cwd: tempDir,
      env: { ...process.env, LANG: 'en_US.UTF-8', LC_ALL: 'en_US.UTF-8' }
    });

    // Cleanup
    fs.rmSync(tempDir, { recursive: true, force: true });

    return { success: true };
  } catch (error) {
    console.error("SVN Update Error", error);
    return { success: false, error: error.message };
  }
});

// SVN Delete
ipcMain.handle('svn-delete', async (event, { url, username, password }) => {
  try {
    const message = "Deleted via SVNC";
    let cmd = `svn delete -m "${message}" --non-interactive --trust-server-cert-failures=unknown-ca,cn-mismatch,expired,not-yet-valid,other "${url}"`;

    if (username && password) {
      cmd += ` --username "${username}" --password "${password}" --no-auth-cache`;
    }

    await execAsync(cmd, {
      env: { ...process.env, LANG: 'en_US.UTF-8', LC_ALL: 'en_US.UTF-8' }
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Message Box (Confirmation)
ipcMain.handle('dialog:showMessageBox', async (event, options) => {
  return await dialog.showMessageBox(mainWindow, options);
});

// SVN Make Directory
ipcMain.handle('svn-mkdir', async (event, { url, message, username, password }) => {
  try {
    const msg = message || "Created folder via SVNC";
    let cmd = `svn mkdir -m "${msg}" --non-interactive --trust-server-cert-failures=unknown-ca,cn-mismatch,expired,not-yet-valid,other "${url}"`;

    if (username && password) {
      cmd += ` --username "${username}" --password "${password}" --no-auth-cache`;
    }

    await execAsync(cmd, {
      env: { ...process.env, LANG: 'en_US.UTF-8', LC_ALL: 'en_US.UTF-8' }
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// SVN Log (History)
ipcMain.handle('svn-log', async (event, { url, username, password }) => {
  try {
    const cmd = `svn log --xml --non-interactive --trust-server-cert-failures=unknown-ca,cn-mismatch,expired,not-yet-valid,other "${url}"` +
      (username && password ? ` --username "${username}" --password "${password}" --no-auth-cache` : '');

    const { stdout } = await execAsync(cmd, {
      env: { ...process.env, LANG: 'en_US.UTF-8', LC_ALL: 'en_US.UTF-8' },
      maxBuffer: 1024 * 1024 * 10
    });
    return { success: true, data: stdout };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// SVN Cat (File Content)
ipcMain.handle('svn-cat', async (event, { url, revision, username, password }) => {
  try {
    let cmd = `svn cat --non-interactive --trust-server-cert-failures=unknown-ca,cn-mismatch,expired,not-yet-valid,other "${url}"`;
    if (revision) {
      cmd += ` -r ${revision}`;
    }
    if (username && password) {
      cmd += ` --username "${username}" --password "${password}" --no-auth-cache`;
    }

    // Use encoding: 'buffer' to handle binary data correctly
    const { stdout } = await execAsync(cmd, {
      encoding: 'buffer',
      env: { ...process.env, LANG: 'en_US.UTF-8', LC_ALL: 'en_US.UTF-8' },
      maxBuffer: 1024 * 1024 * 20 // 20MB limit
    });

    // Detect if text or binary (simple check)
    // If it contains null bytes, likely binary
    const isBinary = stdout.includes(0);

    if (isBinary) {
      return { success: true, type: 'binary', data: stdout.toString('base64') };
    } else {
      return { success: true, type: 'text', data: stdout.toString('utf-8') };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Select Directory
ipcMain.handle('dialog:openDirectory', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  if (result.canceled) return null;
  return result.filePaths[0];
});

// Select File (for Upload)
ipcMain.handle('dialog:openFile', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections']
  });
  if (result.canceled) return null;
  return result.filePaths;
});

// Shell: Open Path
ipcMain.handle('shell:openPath', async (event, { path }) => {
  return await shell.openPath(path);
});

// Get Temp Path
ipcMain.handle('get-temp-path', () => {
  return app.getPath('temp');
});
