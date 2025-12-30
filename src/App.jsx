import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ServerForm from './components/ServerForm';
import FileBrowser from './components/FileBrowser';
import { Toaster, toast } from 'sonner';

function App() {
  const [servers, setServers] = useState([]);
  const [currentServerId, setCurrentServerId] = useState(null);
  const [view, setView] = useState('browser'); // 'edit' can be a sub-state
  const [isEditing, setIsEditing] = useState(false);

  // Load from Persistence
  useEffect(() => {
    const saved = localStorage.getItem('svnc_servers');
    const lastId = localStorage.getItem('svnc_last_active');

    if (saved) {
      const parsed = JSON.parse(saved);
      setServers(parsed);

      // Auto-connect if allowed
      if (lastId && parsed.find(s => s.id === lastId)) {
        setCurrentServerId(lastId);
        toast.success('Restored last session');
      } else if (parsed.length > 0) {
        // Don't auto select if no lastId, let user choose, or maybe select first?
        // Let's select none -> show form
        setIsEditing(true); // Treat as adding new or just empty state
      } else {
        setIsEditing(true); // No servers, show add form
      }
    } else {
      setIsEditing(true);
    }
  }, []);

  // Save Persistence
  useEffect(() => {
    localStorage.setItem('svnc_servers', JSON.stringify(servers));
  }, [servers]);

  useEffect(() => {
    if (currentServerId) {
      localStorage.setItem('svnc_last_active', currentServerId);
    }
  }, [currentServerId]);

  const handleConnect = async (serverData) => {
    // Add or Update
    let newServers = [...servers];
    const existingIndex = newServers.findIndex(s => s.id === serverData.id);

    // Verify connection first? V1 logic did it inside. 
    // Ideally we verify before saving. 
    // For V2: let's try to list root.
    const tid = toast.loading('Verifying connection...');
    try {
      const result = await window.electronAPI.listSvn(serverData.url, serverData.username, serverData.password);
      if (!result.success) {
        toast.error('Connection failed: ' + result.error, { id: tid });
        return;
      }
      toast.dismiss(tid);

      if (existingIndex > -1) {
        newServers[existingIndex] = serverData;
      } else {
        newServers.push(serverData);
      }

      setServers(newServers);
      setCurrentServerId(serverData.id);
      setIsEditing(false);
      toast.success(`Connected to ${serverData.alias || 'Server'}`);
    } catch (e) {
      toast.error('Error: ' + e.message, { id: tid });
    }
  };

  const handleAddServer = () => {
    setIsEditing(true);
    setCurrentServerId(null); // Deselect to show empty form
  };

  const handleDeleteServer = (id) => {
    if (confirm('Are you sure you want to remove this server?')) {
      const newServers = servers.filter(s => s.id !== id);
      setServers(newServers);
      if (currentServerId === id) {
        setCurrentServerId(null);
        setIsEditing(true);
      }
      toast.info('Server removed');
    }
  };

  const activeServer = servers.find(s => s.id === currentServerId);

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      <Toaster position="bottom-right" theme="dark" />

      {/* Sidebar */}
      <Sidebar
        servers={servers}
        currentServerId={currentServerId}
        onSelectServer={(s) => { setCurrentServerId(s.id); setIsEditing(false); }}
        onAddServer={handleAddServer}
        onDeleteServer={handleDeleteServer}
      />

      {/* Main Content */}
      <div style={{ flex: 1, height: '100%', position: 'relative', background: 'var(--bg-primary)' }}>
        {isEditing || !activeServer ? (
          <ServerForm
            onConnect={handleConnect}
            initialData={null} // TODO: Handle Edit mode specifically if needed
          />
        ) : (
          <FileBrowser
            key={activeServer.id} // Re-mount on server switch
            credentials={activeServer}
            onLogout={() => { /* Maybe disconnect? */ }}
          />
        )}
      </div>
    </div>
  );
}

export default App;
