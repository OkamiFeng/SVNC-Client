# SVNC User Manual

**Version**: V1.0  
**Date**: 2025-12-30

---

## 1. Introduction
SVNC is a modern SVN graphical client designed to provide a smooth, beautiful, and efficient version control experience. It simplifies complex SVN commands, allowing you to complete file management through simple drag-and-drop and clicks.

---

## 2. Quick Start

### Login
1. Open the application.
2. Enter **Repository URL** (e.g., `https://svn.example.com/repo`).
3. Enter **Username** and **Password**.
4. Click "Login".

### Interface Overview
- **Top Toolbar**: 
  - `←`: Go Back.
  - `Address Bar`: Displays current path, supports manual input for navigation.
  - `Refresh`: Reload current directory.
  - `New Folder`: Create new directory in current path.
  - `Upload`: Click to select files for upload.
  - `Settings`: Customize file opening methods.
  - `Logout`: Return to login screen.
- **File List**: Displays filename, size, icon.
- **Bottom Status Bar**: Displays selected item count and action buttons (History, Open, Delete).

---

## 3. Detailed Features

### 3.1 Browsing & Navigation
- **Enter Folder**: Double-click folder, or click the small arrow left of the folder to expand (Tree View).
- **Back**: Click `←` button at the top.
- **Copy Path**: Click "Copy" icon on the right of the list item.
- **View Properties**: Click "Info" (i) icon on the right.

### 3.2 File Preview & Open
- **In-App Preview**: 
  - By default, double-clicking text files (txt, md, js, json...) or images (png, jpg) will open a preview window directly in the app.
- **Open Externally**:
  - You can configure specific files (e.g., `.xlsx`) in Settings to open with the system default program.
  - Operation: Double-click the file, or select it and click "Open" at the bottom.

### 3.3 Download
- **Single File Download**: Click "Download" icon on the right.
- **Batch Download**: Select multiple files (hold Ctrl/Cmd or Shift), click "Download All" at the bottom.
- **Select Save Location**: System dialog will pop up asking for save path.

### 3.4 Upload & Update
- **Upload File**: 
  - **Drag & Drop**: Drag files from desktop directly into app window.
  - **Button**: Click "Upload Cloud" icon at the top.
- **Custom Commit Message**: A dialog will appear upon upload where you can enter a Commit Message.
- **Smart Overwrite**:
  - If the uploaded filename already exists, the system automatically executes an `update` -> `commit` workflow.
  - **Advantage**: The file's SVN history is preserved intact, rather than being replaced as a new file.

### 3.5 Version History (Time Travel)
1. Select a file.
2. Click **"History"** button at the bottom.
3. **View Log**: Dialog displays all commit records (Revision, Author, Date, Message).
4. **History Preview**: **Double-click** any row in the history list to view the file content at that historical moment (supports text and images).

### 3.6 Settings
- Click "Settings" icon at the top.
- **File Associations**:
  - Enter extension (e.g., `docx`).
  - Select Action: `Internal Preview` or `External App`.
  - Click "Add".

---

## 4. Important Notes
1. **Network**: Ensure your network can access the SVN server.
2. **SVN CLI**: This software relies on underlying `svn` commands. If you encounter issues on macOS, ensure Command Line Tools are installed (`xcode-select --install`).
3. **Large File Preview**: Previewing very large text files may cause interface lag; it is recommended to use "Download" for large files.

---

## 5. FAQ

**Q: Why do I get an Error when overwriting upload?**  
A: Please check if you have write permissions for that directory. If the file is locked, unlock it and try again.

**Q: No response when double-clicking xlsx file?**  
A: Please go to Settings, add `xlsx`, and set it to `External`. If it still doesn't work, check if Excel or WPS is installed on your computer.

---
*SVNC V1.0 - Designed for Efficiency*
