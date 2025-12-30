# SVNC Development Design Manual

**Version**: V1.0  
**Date**: 2025-12-30

---

## 1. Technology Stack

This project is built using Electron + React + Vite, aiming to provide a modern graphical user interface client for SVN.

- **Core**: Electron (v32+)
- **Frontend Framework**: React (v18)
- **Build Tool**: Vite (v5/v6)
- **UI Styling**: Vanilla CSS + Inline Styles (Glassmorphism Design)
- **Icons**: Lucide React
- **Notifications**: Sonner
- **SVN Interaction**: Node.js `child_process` spawning native `svn` command line tools.
- **Packaging**: electron-builder

---

## 2. Project Structure & File Description

### Core Directories
- **`electron/`**
  - `main.js`: Main process entry point for Electron.
    - Responsible for window creation.
    - **IPC Handlers**: Handles all core SVN operations (`svn-list`, `svn-cat`, `svn-log`, `svn-update`, etc.).
    - Handles file system operations and system shell calls (`shell:openPath`).
  - `preload.js`: Preload script.
    - Securely checks APIs exposed to the renderer process via `contextBridge` (`window.electronAPI`).

- **`src/`**
  - `components/`
    - `FileBrowser.jsx`: Core component. Contains file list, all modals (Preview, History, Settings, Upload), and business logic.
    - `Login.jsx`: Login interface component.
  - `App.jsx`: Routing and state management (switching between Login/File Browser views).
  - `main.jsx`: React entry point.
  - `index.css`: Global base styles.

### Root Configuration
- `package.json`: Dependency management and script definitions.
- `vite.config.js`: Vite build configuration.

---

## 3. Development Environment Setup

### Prerequisites
1.  **Node.js**: Recommended v18+.
2.  **SVN Client**: System must have `svn` command line tools installed and added to `PATH`.
    - macOS: `brew install svn` or Xcode Command Line Tools.
    - Windows: Install TortoiseSVN (must check "Command line tools") or CollabNet SVN.

### Steps
1.  Clone project code.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start development server (Starts React Dev Server and Electron concurrently):
    ```bash
    npm run dev:electron
    ```

---

## 4. Running & Packaging

### Running
- **Development Mode**: `npm run dev:electron` (Supports Hot Reload).

### Packaging (Build & Distribute)
Uses `electron-builder` for packaging.

**Custom App Name & Icon**:
1.  **App Name**: Modify the `build.productName` field in `package.json`.
    ```json
    "build": {
      "productName": "MySVNClient" 
    }
    ```
2.  **App Icon**:
    - Create a `build` folder in the project root (if not exists).
    - Place icon files:
        - macOS: `build/icon.icns`
        - Windows: `build/icon.ico`
        - Linux: `build/icon.png` (512x512)
    - `electron-builder` will automatically detect and use these icons.

**macOS Build**:
```bash
npm run build && npm run dist
```
- Output Directory: `dist/electron/`
- Artifacts: `.dmg` (Installer), `.zip` (Portable/Update).
- Note: Since code signing certificate is not configured, there may be warnings during build, and first launch of `.app` may require manual allowance in "Security & Privacy".

**Windows Build** (Must run on Windows environment):
```bash
npm run build && npm run dist
```
- Artifacts: `.exe` (NSIS Installer).

---

## 5. Version History

### V1.0 (Current Release)
- **Features**:
    1.  **Basic Management**: Login, browse directory, download file/folder, create folder, delete file.
    2.  **Upload Enhancements**: Drag-and-drop upload, custom Commit Message, Smart Overwrite (preserves history).
    3.  **Advanced Preview**: In-app preview for text and images (Preview Modal).
    4.  **Version Control**: View file history (History Log), support double-clicking historical versions for "Time Travel" preview.
    5.  **External Interaction**: Support setting file associations, calling system default programs to open files.
    6.  **UI Polish**: Modern Glassmorphism interface, Sonner message notifications.
