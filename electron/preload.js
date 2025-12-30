const { contextBridge, ipcRenderer, webUtils } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    listSvn: (url, username, password) => ipcRenderer.invoke('svn-list', { url, username, password }),
    downloadSvn: (url, path, username, password) => ipcRenderer.invoke('svn-download', { url, path, username, password }),
    downloadSvnFile: (params) => ipcRenderer.invoke('svn-download-file', params),
    uploadSvn: (params) => ipcRenderer.invoke('svn-import', params),
    updateSvnFile: (params) => ipcRenderer.invoke('svn-update', params),
    deleteSvn: (params) => ipcRenderer.invoke('svn-delete', params),
    createDirectory: (params) => ipcRenderer.invoke('svn-mkdir', params),
    getSvnLog: (params) => ipcRenderer.invoke('svn-log', params),
    getSvnFileContent: (params) => ipcRenderer.invoke('svn-cat', params),
    selectDirectory: () => ipcRenderer.invoke('dialog:openDirectory'),
    selectFile: () => ipcRenderer.invoke('dialog:openFile'),
    showMessageBox: (options) => ipcRenderer.invoke('dialog:showMessageBox', options),
    openPath: (path) => ipcRenderer.invoke('shell:openPath', { path }),
    getTempPath: () => ipcRenderer.invoke('get-temp-path'),
    getPathForFile: (file) => webUtils.getPathForFile(file),
    onDownloadProgress: (callback) => {
        const listener = (event, data) => callback(data);
        ipcRenderer.on('download-progress', listener);
        return () => ipcRenderer.removeListener('download-progress', listener);
    },
});
