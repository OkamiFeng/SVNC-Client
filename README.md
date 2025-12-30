# SVNC - Modern SVN Client

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.0.0-green.svg)
![Electron](https://img.shields.io/badge/Electron-v32+-important.svg)
![React](https://img.shields.io/badge/React-v18-blue.svg)

**SVNC** is a modern, lightweight, and beautiful GUI client for Subversion (SVN), built with Electron and React. It provides a clean interface for managing your version control workflow, featuring drag-and-drop uploads, file previews, and history management.

## ✨ Features

- **Modern UI**: Glassmorphism design with smooth animations and dark mode aesthetic.
- **File Management**: Browse, download, create folders, and delete files with ease.
- **Smart Upload**: 
  - Drag-and-drop support.
  - **Smart Overwrite**: Preserves SVN history when overwriting existing files (Automatic `update` -> `commit`).
  - Custom Commit Messages.
- **Preview & Edit**:
  - **In-App Preview**: View Text, Code, and Images instantly without downloading.
  - **External Open**: Configure specific file types (e.g., `.xlsx`) to open with system default apps.
- **Time Travel**: View file history and preview any past revision instantly.
- **Secure**: Handles credentials securely in memory.

## 🛠 Tech Stack

- **Core**: Electron
- **Frontend**: React + Vite
- **Styling**: Vanilla CSS (Tailored Design)
- **Icons**: Lucide React
- **Build**: Electron Builder

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- SVN Command Line Tools installed and accessible in `PATH`.
  - macOS: `brew install svn`
  - Windows: TortoiseSVN (CommandLine Tools enabled)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/OkamiFeng/SVNC-Client.git
   ```
2. Install dependencies:
   ```bash
   cd SVNC
   npm install
   ```

### Development

Start the development server (Hot Reload for both Renderer and Main process):

```bash
npm run dev:electron
```

### Build

Build the application for your local platform:

```bash
# macOS
npm run build && npm run dist

# Windows (Run on Windows)
npm run build && npm run dist
```

## 📖 Documentation

- **English**:
  - [User Manual](USER_MANUAL.md)
  - [Development Manual](DEV_MANUAL.md)
- **中文文档 (Chinese)**:
  - [用户手册](USER_MANUAL_CHS.md)
  - [开发手册](DEV_MANUAL_CHS.md)

## 📂 Project Structure

```
SVNC/
├── electron/        # Main process & Preload script
├── src/             # React Renderer process
│   ├── components/  # UI Components (FileBrowser, Login, Modals)
│   └── ...
├── dist/            # Build output (Git ignored)
└── ...
```

## 📄 License

This project is licensed under the MIT License.

## ☕ Buy Me a Coffee

If you find this project helpful, please consider buying me a coffee!

![Buy Me A Coffee](buy_me_a_coffee.jpg)
