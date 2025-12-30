# SVNC 开发设计手册 (Development Design Manual)

**版本**: V1.0  
**日期**: 2025-12-30

---

## 1. 技术栈 (Technology Stack)

本通过 Electron + React + Vite 构建，旨在提供一个现代化的 SVN 图形界面客户端。

- **Core**: Electron (v32+)
- **Frontend Framework**: React (v18)
- **Build Tool**: Vite (v5/v6)
- **UI Styling**: Vanilla CSS + Inline Styles (Glassmorphism Design)
- **Icons**: Lucide React
- **Notifications**: Sonner
- **SVN Interaction**: Node.js `child_process` spawning native `svn` command line tools.
- **Packaging**: electron-builder

---

## 2. 项目结构与文件说明 (File Structure)

### 核心目录
- **`electron/`**
  - `main.js`: Electron 主进程入口。
    - 负责创建窗口。
    - **IPC Handlers**: 处理所有 SVN 核心操作 (`svn-list`, `svn-cat`, `svn-log`, `svn-update` 等)。
    - 处理文件系统操作与系统 Shell 调用 (`shell:openPath`).
  - `preload.js`: 预加载脚本。
    - 使用 `contextBridge` 安全暴露 API 给渲染进程 (`window.electronAPI`)。

- **`src/`**
  - `components/`
    - `FileBrowser.jsx`: 核心组件。包含文件列表、所有模态框 (Preview, History, Settings, Upload) 及业务逻辑。
    - `Login.jsx`: 登录界面组件。
  - `App.jsx`: 路由与状态管理（切换登录/文件浏览视图）。
  - `main.jsx`: React 入口。
  - `index.css`: 全局基础样式。

### 根目录配置
- `package.json`: 依赖管理与脚本定义。
- `vite.config.js`: Vite 构建配置。

---

## 3. 开发环境部署 (Development Setup)

### 前置要求
1.  **Node.js**: 建议 v18+。
2.  **SVN Client**: 系统必须安装 `svn` 命令行工具，并确保加入了环境变量 `PATH`。
    - macOS: `brew install svn` 或 Xcode Command Line Tools.
    - Windows: 安装 TortoiseSVN (需勾选 Command line tools) 或 CollabNet SVN.

### 步骤
1.  克隆项目代码。
2.  安装依赖：
    ```bash
    npm install
    ```
3.  启动开发服务器 (同时启动 React Dev Server 和 Electron)：
    ```bash
    npm run dev:electron
    ```

---

## 4. 运行与打包 (Running & Packaging)

### 运行
- **开发模式**: `npm run dev:electron` (支持热重载)。

### 打包 (Build & Distribute)
使用 `electron-builder` 进行打包。

**自定义应用名称与图标**:
1.  **应用名称**: 修改 `package.json` 中的 `build.productName` 字段。
    ```json
    "build": {
      "productName": "MySVNClient" 
    }
    ```
2.  **应用图标**:
    - 在项目根目录创建 `build` 文件夹（如果不存在）。
    - 放入图标文件:
        - macOS: `build/icon.icns`
        - Windows: `build/icon.ico`
        - Linux: `build/icon.png` (512x512)
    - `electron-builder` 会自动检测并使用这些图标。

**macOS 打包**:
```bash
npm run build && npm run dist
```
- 输出目录: `dist/electron/`
- 产物: `.dmg` (安装包), `.zip` (免安装/更新用)。
- 注意: 由于未配置代码签名证书，打包过程中可能会有 warning，且首次运行 `.app` 可能需要手动在"安全性与隐私"中允许。

**Windows 打包** (需在 Windows 环境下运行):
```bash
npm run build && npm run dist
```
- 产物: `.exe` (NSIS Installer)。

---

## 5. 版本历史 (Version History)

### V1.0 (Current Release)
- **功能**:
    1.  **基础管理**: 登录、浏览目录、下载文件/文件夹、创建文件夹、删除文件。
    2.  **上传增强**: 支持拖拽上传，支持自定义 Commit Message，支持智能覆盖 (Smart Overwrite, 保留历史)。
    3.  **高级预览**: 支持文本与图片的应用内预览 (Preview Modal)。
    4.  **版本控制**: 查看文件历史 (History Log)，支持双击历史版本进行"时光机"预览。
    5.  **外部交互**: 支持设置文件关联，调用系统默认程序打开文件。
    6.  **UI 优化**: 现代化玻璃拟态界面，Sonner 消息提示。
