import React, { useState, useEffect, useRef } from 'react';
import { Folder, File, ArrowLeft, Download, RefreshCw, LogOut, ChevronRight, ChevronDown, Copy, UploadCloud, X, Trash2, FolderPlus, Clock, Settings, FileText, Plus, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { formatBytes } from '../utils/format';

export default function FileBrowser({ credentials, onLogout }) {
    const [rootUrl, setRootUrl] = useState(credentials.url);
    const [rootItems, setRootItems] = useState([]);
    const [expandedFolders, setExpandedFolders] = useState({});
    const [childrenCache, setChildrenCache] = useState({});
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('');
    const [addressBar, setAddressBar] = useState(credentials.url);
    const [showProperties, setShowProperties] = useState(false);

    // Modals
    const [showNewFolderModal, setShowNewFolderModal] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');

    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadFilesList, setUploadFilesList] = useState([]);
    const [uploadMessage, setUploadMessage] = useState('Uploaded via SVNC');

    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(null);
    const [showPreviewModal, setShowPreviewModal] = useState(null);

    // Settings State
    const [settings, setSettings] = useState(() => {
        const saved = localStorage.getItem('svnc_settings');
        return saved ? JSON.parse(saved) : {
            associations: {
                'txt': 'internal', 'md': 'internal', 'js': 'internal', 'jsx': 'internal',
                'json': 'internal', 'xml': 'internal', 'html': 'internal', 'css': 'internal',
                'png': 'internal', 'jpg': 'internal', 'jpeg': 'internal', 'svg': 'internal'
                // xlsx, docx etc usually fall back to 'external' by default check
            }
        };
    });

    // New Association Input State
    const [newExt, setNewExt] = useState('');
    const [newAction, setNewAction] = useState('external');

    // Selection State
    const [selectedItems, setSelectedItems] = useState(new Map());
    const lastSelectedRef = useRef(null);

    useEffect(() => {
        loadDirectory(credentials.url, true);
    }, []);

    useEffect(() => {
        localStorage.setItem('svnc_settings', JSON.stringify(settings));
    }, [settings]);

    useEffect(() => {
        const cleanup = window.electronAPI.onDownloadProgress(({ id, progress }) => {
            toast.loading(`Downloading... ${progress}%`, { id: id });
        });
        return () => cleanup();
    }, []);

    useEffect(() => {
        setAddressBar(rootUrl);
    }, [rootUrl]);

    // --- Logic ---

    const loadDirectory = async (url, isRoot = false) => {
        if (isRoot) {
            setLoading(true);
            setStatus('Loading...');
            setSelectedItems(new Map());
        }

        try {
            const result = await window.electronAPI.listSvn(url, credentials.username, credentials.password);
            if (result.success) {
                const items = parseSvnXml(result.data, url);
                items.sort((a, b) => {
                    if (a.kind === b.kind) return a.name.localeCompare(b.name);
                    return a.kind === 'dir' ? -1 : 1;
                });

                if (isRoot) {
                    setRootUrl(url);
                    setRootItems(items);
                    setStatus(`${items.length} items`);
                } else {
                    return items;
                }
            } else {
                toast.error(`Failed to list directory: ${result.error}`);
                if (isRoot) setStatus('Error');
                return null;
            }
        } catch (e) {
            toast.error('Error: ' + e.message);
            return null;
        } finally {
            if (isRoot) setLoading(false);
        }
    };

    const parseSvnXml = (xmlString, parentUrl) => {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, "text/xml");
        const entries = xmlDoc.getElementsByTagName("entry");
        const items = [];
        const baseUrl = parentUrl.endsWith('/') ? parentUrl : parentUrl + '/';

        for (let i = 0; i < entries.length; i++) {
            const entry = entries[i];
            const kind = entry.getAttribute("kind");
            const name = entry.getElementsByTagName("name")[0]?.textContent;
            const sizeStr = entry.getElementsByTagName("size")[0]?.textContent;
            const commit = entry.getElementsByTagName("commit")[0];
            const revision = commit?.getAttribute("revision");
            const author = commit?.getElementsByTagName("author")[0]?.textContent;
            const date = commit?.getElementsByTagName("date")[0]?.textContent;

            items.push({
                kind,
                name,
                size: sizeStr ? parseInt(sizeStr, 10) : 0,
                date,
                author,
                revision,
                fullUrl: baseUrl + name
            });
        }
        return items;
    };

    const handleExpandWrapper = async (item) => {
        if (expandedFolders[item.fullUrl]) {
            const newExpanded = { ...expandedFolders };
            delete newExpanded[item.fullUrl];
            setExpandedFolders(newExpanded);
        } else {
            if (!childrenCache[item.fullUrl]) {
                const children = await loadDirectory(item.fullUrl, false);
                if (children) {
                    setChildrenCache(prev => ({ ...prev, [item.fullUrl]: children }));
                    setExpandedFolders(prev => ({ ...prev, [item.fullUrl]: true }));
                }
            } else {
                setExpandedFolders(prev => ({ ...prev, [item.fullUrl]: true }));
            }
        }
    };

    const handleAddressSubmit = (e) => {
        if (e.key === 'Enter') loadDirectory(addressBar, true);
    };

    const handleUp = () => {
        let url = rootUrl;
        if (url.endsWith('/')) url = url.slice(0, -1);
        const lastSlash = url.lastIndexOf('/');
        if (lastSlash > -1) loadDirectory(url.substring(0, lastSlash), true);
    };

    // --- V16 Logic: Open External & Settings ---

    const getAssociation = (fileName) => {
        const ext = fileName.split('.').pop().toLowerCase();
        return settings.associations[ext] || 'external'; // Default external if not found? Or maybe suggest? 
        // Actually for unknown extensions, 'external' (system default) is a safe bet if we implement it efficiently.
    };

    // Open with System Default (V16)
    const handleOpenExternal = async (item) => {
        const toastId = toast.loading(`Opening ${item.name}...`);
        try {
            // 1. Get Temp Path
            const tempDir = await window.electronAPI.getTempPath();
            const svncTemp = tempDir; // Or append subdir if desired
            // 2. Download file to temp
            const destination = svncTemp.endsWith('/') || svncTemp.endsWith('\\') ? svncTemp + item.name : svncTemp + '/' + item.name;

            const result = await window.electronAPI.downloadSvnFile({
                url: item.fullUrl,
                path: destination,
                username: credentials.username,
                password: credentials.password,
                size: item.size,
                id: toastId
            });

            if (result.success) {
                // 3. Open Path
                toast.loading("Launching application...", { id: toastId });
                const openResult = await window.electronAPI.openPath(result.path);
                if (openResult !== "") {
                    toast.error(`Failed to open: ${openResult}`, { id: toastId });
                } else {
                    toast.success("Opened successfully", { id: toastId });
                }
            } else {
                throw new Error(result.error);
            }
        } catch (e) {
            toast.error(`Failed to open: ${e.message}`, { id: toastId });
        }
    };

    const handlePreview = async (item, revisionFragment = null) => {
        const toastId = toast.loading("Loading preview...");
        try {
            const result = await window.electronAPI.getSvnFileContent({
                url: item.fullUrl,
                revision: revisionFragment,
                username: credentials.username,
                password: credentials.password
            });

            if (result.success) {
                toast.dismiss(toastId);
                setShowPreviewModal({
                    item: item,
                    content: result.data,
                    type: result.type,
                    revision: revisionFragment
                });
            } else {
                toast.error(`Preview failed: ${result.error}`, { id: toastId });
            }
        } catch (e) {
            toast.error(`Preview error: ${e.message}`, { id: toastId });
        }
    };

    const handleHistory = async (item) => {
        const toastId = toast.loading("Fetching history...");
        try {
            const result = await window.electronAPI.getSvnLog({
                url: item.fullUrl,
                username: credentials.username,
                password: credentials.password
            });

            if (result.success) {
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(result.data, "text/xml");
                const logEntries = xmlDoc.getElementsByTagName("logentry");
                const logs = [];
                for (let i = 0; i < logEntries.length; i++) {
                    const entry = logEntries[i];
                    logs.push({
                        revision: entry.getAttribute("revision"),
                        author: entry.getElementsByTagName("author")[0]?.textContent,
                        date: entry.getElementsByTagName("date")[0]?.textContent,
                        msg: entry.getElementsByTagName("msg")[0]?.textContent
                    });
                }
                setShowHistoryModal({ item, logs });
                toast.dismiss(toastId);
            } else {
                toast.error(`Fetch Log failed: ${result.error}`, { id: toastId });
            }
        } catch (e) {
            toast.error(`Fetch Log error: ${e.message}`, { id: toastId });
        }
    };

    const handleAddExtension = () => {
        if (!newExt) return;
        const ext = newExt.replace(/^\./, '').toLowerCase(); // remove leading dot
        setSettings({
            ...settings,
            associations: { ...settings.associations, [ext]: newAction }
        });
        setNewExt('');
        toast.success(`Added .${ext} as ${newAction}`);
    };

    // --- Basic Actions ---

    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) return;
        const targetUrl = rootUrl.endsWith('/') ? rootUrl + newFolderName.trim() : rootUrl + '/' + newFolderName.trim();
        setShowNewFolderModal(false);
        setNewFolderName('');
        const toastId = toast.loading(`Creating folder...`);
        try {
            const result = await window.electronAPI.createDirectory({ url: targetUrl, username: credentials.username, password: credentials.password });
            if (result.success) {
                toast.success(`Created folder`, { id: toastId });
                loadDirectory(rootUrl, true);
            } else {
                toast.error(`Failed: ${result.error}`, { id: toastId });
            }
        } catch (e) { toast.error(`Error: ${e.message}`, { id: toastId }); }
    };

    const handleDownload = async (item) => {
        const localPath = await window.electronAPI.selectDirectory();
        if (!localPath) return;
        triggerDownload(item, localPath);
    };

    const handleBatchDownload = async () => {
        if (selectedItems.size === 0) return;
        const localPath = await window.electronAPI.selectDirectory();
        if (!localPath) return;
        const items = Array.from(selectedItems.values());
        items.forEach(item => triggerDownload(item, localPath));
        toast.info(`Started ${items.length} downloads...`);
    };

    const triggerDownload = (item, localPath) => {
        const isFile = item.kind !== 'dir';
        const toastId = `dl-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        toast.loading(`Starting download: ${item.name}...`, { id: toastId });

        const run = async () => {
            if (isFile) {
                const destination = localPath.endsWith('/') ? localPath + item.name : localPath + '/' + item.name;
                const result = await window.electronAPI.downloadSvnFile({
                    url: item.fullUrl, path: destination, username: credentials.username, password: credentials.password, size: item.size, id: toastId
                });
                if (!result.success) throw new Error(result.error);
                return result.path;
            } else {
                const result = await window.electronAPI.downloadSvn(item.fullUrl, localPath, credentials.username, credentials.password);
                if (!result.success) throw new Error(result.error);
                return result.path;
            }
        };

        run().then(() => toast.success(`Downloaded: ${item.name}`, { id: toastId }))
            .catch((e) => toast.error(`Failed ${item.name}: ${e.message}`, { id: toastId }));
    }

    const handleCopy = (text) => { navigator.clipboard.writeText(text); toast.success(`Copied to clipboard`); };

    const handleDelete = async (item) => {
        const { response } = await window.electronAPI.showMessageBox({
            type: 'warning', buttons: ['Cancel', 'Delete'], defaultId: 0, title: 'Confirm Delete',
            message: `Delete "${item.name}"?`, detail: `This action cannot be undone.`
        });
        if (response === 1) {
            const toastId = toast.loading(`Deleting...`);
            try {
                const result = await window.electronAPI.deleteSvn({ url: item.fullUrl, username: credentials.username, password: credentials.password });
                if (result.success) {
                    toast.success(`Deleted`, { id: toastId });
                    loadDirectory(rootUrl, true);
                } else { toast.error(`Failed: ${result.error}`, { id: toastId }); }
            } catch (e) { toast.error(`Failed: ${e.message}`, { id: toastId }); }
        }
    };

    const handleUpload = async () => {
        const filePaths = await window.electronAPI.selectFile();
        if (!filePaths || filePaths.length === 0) return;
        setUploadFilesList(filePaths);
        setUploadMessage('Uploaded via SVNC');
        setShowUploadModal(true);
    };

    const performUpload = async () => {
        setShowUploadModal(false);
        const filePaths = uploadFilesList;
        if (!filePaths || filePaths.length === 0) return;
        const total = filePaths.length;
        const toastId = toast.loading(`Starting upload...`);
        let successCount = 0;
        const existingNames = new Set(rootItems.map(i => i.name));

        for (let i = 0; i < total; i++) {
            try {
                const filePath = filePaths[i];
                if (!filePath) continue;
                const fileName = filePath.split(/[/\\]/).pop();
                const targetUrl = rootUrl.endsWith('/') ? rootUrl + fileName : rootUrl + '/' + fileName;
                const isOverwrite = existingNames.has(fileName);
                toast.loading(`${isOverwrite ? "Updating" : "Uploading"} ${fileName} (${i + 1}/${total})...`, { id: toastId });
                let result;
                if (isOverwrite) {
                    result = await window.electronAPI.updateSvnFile({ localPath: filePath, remoteUrl: targetUrl, message: uploadMessage, username: credentials.username, password: credentials.password });
                } else {
                    result = await window.electronAPI.uploadSvn({ localPath: filePath, remoteUrl: targetUrl, message: uploadMessage, username: credentials.username, password: credentials.password });
                }
                if (result.success) successCount++;
            } catch (e) { console.error(e); }
        }
        toast.success(`Processed ${successCount}/${total} items`, { id: toastId });
        loadDirectory(rootUrl, true);
    };

    const handleDrop = async (e) => {
        e.preventDefault(); e.stopPropagation();
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const files = Array.from(e.dataTransfer.files).map(f => window.electronAPI.getPathForFile(f)).filter(p => !!p);
            if (files.length === 0) { toast.error("File path resolution failed"); return; }
            setUploadFilesList(files);
            setUploadMessage('Uploaded via SVNC');
            setShowUploadModal(true);
        }
    };

    const handleRowClick = (e, item) => {
        e.stopPropagation();
        let newSelection = new Map(selectedItems);
        if (e.metaKey || e.ctrlKey) {
            newSelection.has(item.fullUrl) ? newSelection.delete(item.fullUrl) : newSelection.set(item.fullUrl, item);
        } else {
            newSelection = new Map(); newSelection.set(item.fullUrl, item);
        }
        setSelectedItems(newSelection);
        lastSelectedRef.current = item;
    };

    const handleRowDoubleClick = (item) => {
        if (item.kind === 'dir') {
            loadDirectory(item.fullUrl, true);
        } else {
            const mode = getAssociation(item.name);
            if (mode === 'internal') {
                handlePreview(item);
            } else {
                handleOpenExternal(item);
            }
        }
    };

    const renderRows = (items, depth = 0) => {
        let rows = [];
        items.forEach((item) => {
            const isExpanded = !!expandedFolders[item.fullUrl];
            const hasChildren = isExpanded && childrenCache[item.fullUrl];
            const isSelected = selectedItems.has(item.fullUrl);
            rows.push(
                <tr key={item.fullUrl} className={`file-row ${isSelected ? 'selected' : ''}`}
                    onClick={(e) => handleRowClick(e, item)} onDoubleClick={() => handleRowDoubleClick(item)}>
                    <td style={{ paddingLeft: `${16 + depth * 20}px` }} className="cell-name">
                        {item.kind === 'dir' && (
                            <button className="expand-btn" onClick={(e) => { e.stopPropagation(); handleExpandWrapper(item); }}>
                                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </button>
                        )}
                        {item.kind !== 'dir' && <span className="spacer"></span>}
                        {item.kind === 'dir' ? <Folder size={16} className="icon-dir" /> : <File size={16} className="icon-file" />}
                        <span className="name-text">{item.name}</span>
                    </td>
                    <td className="cell-size">{item.kind === 'dir' ? '-' : formatBytes(item.size)}</td>
                    <td className="cell-actions">
                        <button className="action-btn" onClick={(e) => { e.stopPropagation(); setShowProperties(item); }} title="Properties"><InfoIcon /></button>
                        <button className="action-btn" onClick={(e) => { e.stopPropagation(); handleCopy(item.fullUrl); }} title="Copy Path"><Copy size={14} /></button>
                        <button className="action-btn" onClick={(e) => { e.stopPropagation(); handleDownload(item); }} title="Download"><Download size={14} /></button>
                    </td>
                </tr>
            );
            if (hasChildren) rows = rows.concat(renderRows(childrenCache[item.fullUrl], depth + 1));
        });
        return rows;
    };

    // Tiny Helper Components
    const InfoIcon = () => (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
    );

    return (
        <div className="fade-in file-browser" onDrop={handleDrop} onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}>
            <style>{`
                .file-browser { display: flex; flex-direction: column; height: 100%; user-select: none; }
                .glass-panel { background: rgba(0,0,0,0.2); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; }
                .btn { padding: 8px; background: transparent; border: none; cursor: pointer; color: var(--text-primary); border-radius: 6px; transition: background 0.2s; display: flex; align-items: center; justify-content: center; }
                .btn:hover { background: rgba(255,255,255,0.1); }
                .input { background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); color: white; border-radius: 6px; padding: 8px; font-family: inherit; }
                .input:focus { outline: 1px solid var(--accent); border-color: var(--accent); }
                
                table { width: 100%; border-collapse: collapse; }
                thead { position: sticky; top: 0; background: rgba(30,30,30,0.95); z-index: 10; font-size: 0.85rem; color: var(--text-secondary); backdrop-filter: blur(4px); }
                th { padding: 10px 16px; text-align: left; font-weight: 500; }
                th.right { text-align: right; }
                
                .file-row { border-bottom: 1px solid rgba(255,255,255,0.05); transition: background 0.1s; cursor: default; }
                .file-row:hover { background: rgba(255,255,255,0.03); }
                .file-row.selected { background: rgba(59, 130, 246, 0.4) !important; color: white; }
                .file-row.selected .cell-size { color: rgba(255,255,255,0.9); }
                
                .cell-name { display: flex; align-items: center; padding: 8px 16px; font-size: 0.9rem; }
                .cell-size { text-align: right; padding: 8px 12px; font-family: monospace; font-size: 0.85rem; color: var(--text-secondary); }
                .cell-actions { padding: 8px 12px; display: flex; gap: 4px; justify-content: flex-end; }
                
                .expand-btn { background: none; border: none; color: var(--text-secondary); cursor: pointer; padding: 0; margin-right: 4px; display: flex; }
                .spacer { width: 14px; margin-right: 4px; }
                .icon-dir { color: #fbbf24; margin-right: 8px; }
                .icon-file { color: #94a3b8; margin-right: 8px; }
                .action-btn { background: transparent; border: none; color: var(--text-secondary); cursor: pointer; padding: 4px; border-radius: 4px; opacity: 0.6; }
                .file-row:hover .action-btn { opacity: 1; }
                .action-btn:hover { background: rgba(255,255,255,0.2); color: white; }
                
                /* Modal Polish */
                .modal-backdrop { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(5px); display: flex; align-items: center; justify-content: center; }
                .modal-content { background: #1e1e1e; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); border-radius: 16px; padding: 24px; color: #ececec; display: flex; flex-direction: column; animation: modalIn 0.2s ease-out; }
                .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 12px; }
                .modal-title { font-size: 1.25rem; font-weight: 600; margin: 0; }
                .close-btn { background: none; border: none; color: var(--text-secondary); cursor: pointer; padding: 4px; border-radius: 50%; }
                .close-btn:hover { background: rgba(255,255,255,0.1); color: white; }
                
                @keyframes modalIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
                
                /* Z-Index Hierarchy */
                .z-normal { z-index: 100; }
                .z-high { z-index: 200; } 
            `}</style>

            {/* Toolbar */}
            <div className="glass-panel" style={{ padding: '12px 16px', margin: '16px', marginBottom: '0', display: 'flex', gap: '12px', alignItems: 'center' }}>
                <button className="btn" onClick={handleUp} title="Go Up"><ArrowLeft size={18} /></button>
                <input className="input" style={{ flex: 1 }} value={addressBar} onChange={e => setAddressBar(e.target.value)} onKeyDown={handleAddressSubmit} placeholder="SVN URL" />
                <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.1)' }}></div>
                <button className="btn" onClick={() => loadDirectory(rootUrl, true)} title="Refresh"><RefreshCw size={18} /></button>
                <button className="btn" onClick={() => setShowNewFolderModal(true)} title="New Folder"><FolderPlus size={18} /></button>
                <button className="btn" onClick={handleUpload} title="Upload"><UploadCloud size={18} /></button>
                <button className="btn" onClick={() => setShowSettingsModal(true)} title="Settings"><Settings size={18} /></button>
                <button className="btn" onClick={onLogout} title="Logout"><LogOut size={18} /></button>
            </div>

            {/* File List */}
            <div className="glass-panel" style={{ flex: 1, margin: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }} onClick={() => setSelectedItems(new Map())}>
                <div style={{ overflowY: 'auto', flex: 1 }}>
                    {loading && rootItems.length === 0 ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading directory...</div>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th className="right">Size</th>
                                    <th className="right" style={{ width: '100px' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>{renderRows(rootItems)}</tbody>
                        </table>
                    )}
                </div>
                {/* Footer Status */}
                <div style={{ padding: '8px 16px', borderTop: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{selectedItems.size > 0 ? `${selectedItems.size} selected` : `${rootItems.length} items`}</span>
                    {selectedItems.size > 0 && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                            {selectedItems.size === 1 && (
                                <>
                                    <button className="btn" style={{ padding: '4px 8px', fontSize: '0.75rem', background: 'rgba(255,255,255,0.05)' }} onClick={() => handleHistory(selectedItems.values().next().value)}><Clock size={12} style={{ marginRight: 4 }} /> History</button>
                                    <button className="btn" style={{ padding: '4px 8px', fontSize: '0.75rem', background: 'rgba(255,255,255,0.05)' }} onClick={() => handleRowDoubleClick(selectedItems.values().next().value)}>
                                        {getAssociation(selectedItems.values().next().value.name) === 'internal' ? <FileText size={12} style={{ marginRight: 4 }} /> : <ExternalLink size={12} style={{ marginRight: 4 }} />}
                                        Open
                                    </button>
                                    <button className="btn" style={{ padding: '4px 8px', fontSize: '0.75rem', background: 'rgba(220, 38, 38, 0.2)', color: '#f87171' }} onClick={() => handleDelete(selectedItems.values().next().value)}><Trash2 size={12} style={{ marginRight: 4 }} /> Delete</button>
                                </>
                            )}
                            {selectedItems.size > 1 && <button className="btn" onClick={handleBatchDownload}><Download size={14} /> Download All</button>}
                        </div>
                    )}
                </div>
            </div>

            {/* --- Modals --- */}

            {/* Settings Modal */}
            {showSettingsModal && (
                <div className="modal-backdrop z-normal" onClick={() => setShowSettingsModal(false)}>
                    <div className="modal-content" style={{ width: '500px', height: '600px' }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Settings</h3>
                            <button className="close-btn" onClick={() => setShowSettingsModal(false)}><X size={20} /></button>
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto' }}>
                            <div style={{ marginBottom: '20px', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                                <h4 style={{ margin: '0 0 12px 0', fontSize: '0.95rem' }}>Add New Association</h4>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <input className="input" placeholder="ext (e.g. xlsx)" value={newExt} onChange={e => setNewExt(e.target.value)} style={{ width: '120px' }} />
                                    <select className="input" value={newAction} onChange={e => setNewAction(e.target.value)}>
                                        <option value="external">External App (System Default)</option>
                                        <option value="internal">Internal Preview</option>
                                    </select>
                                    <button className="btn" style={{ background: 'var(--accent)', color: 'black' }} onClick={handleAddExtension}><Plus size={16} /> Add</button>
                                </div>
                            </div>
                            <h4 style={{ margin: '0 0 12px 0', fontSize: '0.95rem' }}>Current Associations</h4>
                            <table style={{ fontSize: '0.9rem' }}>
                                <thead style={{ background: 'transparent' }}>
                                    <tr><th style={{ padding: '8px' }}>Ext</th><th style={{ padding: '8px' }}>Action</th></tr>
                                </thead>
                                <tbody>
                                    {Object.entries(settings.associations).map(([ext, action]) => (
                                        <tr key={ext} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <td style={{ padding: '8px' }}>.{ext}</td>
                                            <td style={{ padding: '8px', color: action === 'internal' ? 'var(--accent)' : 'var(--text-secondary)' }}>
                                                {action === 'internal' ? 'Internal Preview' : 'External App'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* History Modal (Z-Normal) */}
            {showHistoryModal && (
                <div className="modal-backdrop z-normal" onClick={() => setShowHistoryModal(null)}>
                    <div className="modal-content" style={{ width: '700px', height: '600px' }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">History: {showHistoryModal.item.name}</h3>
                            <button className="close-btn" onClick={() => setShowHistoryModal(null)}><X size={20} /></button>
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto' }}>
                            <table style={{ fontSize: '0.9rem' }}>
                                <thead style={{ background: 'rgba(30,30,30,0.95)' }}>
                                    <tr>
                                        <th style={{ width: '60px' }}>Rev</th>
                                        <th style={{ width: '140px' }}>Date</th>
                                        <th style={{ width: '100px' }}>Author</th>
                                        <th>Message</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {showHistoryModal.logs.map((log) => (
                                        <tr key={log.revision} className="file-row" onDoubleClick={() => handlePreview(showHistoryModal.item, log.revision)}>
                                            <td style={{ padding: '8px', fontWeight: 'bold', color: 'var(--accent)' }}>{log.revision}</td>
                                            <td style={{ padding: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{new Date(log.date).toLocaleString()}</td>
                                            <td style={{ padding: '8px' }}>{log.author}</td>
                                            <td style={{ padding: '8px', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={log.msg}>{log.msg}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '16px' }}>Double-click a revision to preview.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Preview Modal (Z-High - Above History) */}
            {showPreviewModal && (
                <div className="modal-backdrop z-high" onClick={() => setShowPreviewModal(null)}>
                    <div className="modal-content" style={{ width: '900px', height: '80vh' }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <FileText size={20} color="var(--accent)" />
                                <span className="modal-title">{showPreviewModal.item.name}</span>
                                {showPreviewModal.revision && <span style={{ fontSize: '0.75rem', background: 'var(--accent)', color: 'black', padding: '2px 6px', borderRadius: '4px' }}>Rev {showPreviewModal.revision}</span>}
                            </div>
                            <button className="close-btn" onClick={() => setShowPreviewModal(null)}><X size={20} /></button>
                        </div>
                        <div style={{ flex: 1, overflow: 'auto', background: '#111', borderRadius: '8px', padding: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            {showPreviewModal.type === 'text' ? (
                                <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: '0.9rem', whiteSpace: 'pre-wrap', wordBreak: 'break-all', color: '#ccc' }}>
                                    {showPreviewModal.content}
                                </pre>
                            ) : showPreviewModal.type === 'binary' ? (
                                ['png', 'jpg', 'jpeg', 'gif', 'svg'].includes(showPreviewModal.item.name.split('.').pop().toLowerCase()) ? (
                                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                                        <img src={`data:image/${showPreviewModal.item.name.split('.').pop()};base64,${showPreviewModal.content}`} style={{ maxWidth: '100%', borderRadius: '4px' }} />
                                    </div>
                                ) : (
                                    <div style={{ textAlign: 'center', marginTop: '60px', color: 'var(--text-secondary)' }}>
                                        <p>This is a binary file.</p>
                                        <button className="btn" style={{ background: 'rgba(255,255,255,0.1)', margin: '0 auto' }} onClick={() => handleDownload(showPreviewModal.item)}>Download File</button>
                                    </div>
                                )
                            ) : <div>Unknown format</div>}
                        </div>
                    </div>
                </div>
            )}

            {/* Upload Modal (Z-Normal) */}
            {showUploadModal && (
                <div className="modal-backdrop z-normal" onClick={() => setShowUploadModal(false)}>
                    <div className="modal-content" style={{ width: '400px' }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Upload Files</h3>
                            <button className="close-btn" onClick={() => setShowUploadModal(false)}><X size={20} /></button>
                        </div>
                        <div style={{ marginBottom: '16px', color: 'var(--text-secondary)' }}>
                            {uploadFilesList.length} files selected.
                        </div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Commit Message</label>
                        <textarea className="input" style={{ width: '100%', height: '80px', resize: 'vertical', marginBottom: '20px' }} value={uploadMessage} onChange={e => setUploadMessage(e.target.value)} />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            <button className="btn" onClick={() => setShowUploadModal(false)}>Cancel</button>
                            <button className="btn" style={{ background: 'white', color: 'black' }} onClick={performUpload}>Upload</button>
                        </div>
                    </div>
                </div>
            )}

            {/* New Folder Modal */}
            {showNewFolderModal && (
                <div className="modal-backdrop z-normal" onClick={() => setShowNewFolderModal(false)}>
                    <div className="modal-content" style={{ width: '320px' }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">New Folder</h3>
                            <button className="close-btn" onClick={() => setShowNewFolderModal(false)}><X size={20} /></button>
                        </div>
                        <input className="input" autoFocus value={newFolderName} onChange={e => setNewFolderName(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') handleCreateFolder() }} placeholder="Name" style={{ width: '100%', marginBottom: '20px' }} />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            <button className="btn" onClick={() => setShowNewFolderModal(false)}>Cancel</button>
                            <button className="btn" style={{ background: 'white', color: 'black' }} onClick={handleCreateFolder}>Create</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Properties Modal */}
            {showProperties && (
                <div className="modal-backdrop z-normal" onClick={() => setShowProperties(null)}>
                    <div className="modal-content" style={{ width: '400px' }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Properties</h3>
                            <button className="close-btn" onClick={() => setShowProperties(null)}><X size={20} /></button>
                        </div>
                        <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
                            {showProperties.kind === 'dir' ? <Folder size={40} color="#fbbf24" /> : <File size={40} color="#94a3b8" />}
                            <div>
                                <div style={{ fontSize: '1.1rem', fontWeight: '600', wordBreak: 'break-all' }}>{showProperties.name}</div>
                                <div style={{ color: 'var(--text-secondary)' }}>{showProperties.kind}</div>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '8px', fontSize: '0.9rem' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Size:</span><span>{showProperties.kind === 'dir' ? '-' : formatBytes(showProperties.size)}</span>
                            <span style={{ color: 'var(--text-secondary)' }}>Rev:</span><span>{showProperties.revision || '-'}</span>
                            <span style={{ color: 'var(--text-secondary)' }}>Author:</span><span>{showProperties.author || '-'}</span>
                            <span style={{ color: 'var(--text-secondary)' }}>Date:</span><span>{showProperties.date ? new Date(showProperties.date).toLocaleString() : '-'}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
