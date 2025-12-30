import React from 'react';
import { Server, Plus, HardDrive, Trash2 } from 'lucide-react';

export default function Sidebar({ servers, currentServerId, onSelectServer, onAddServer, onDeleteServer }) {
    return (
        <div style={{
            width: '250px',
            background: 'var(--bg-secondary)',
            borderRight: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            flexShrink: 0
        }}>
            {/* Header */}
            <div style={{ padding: '50px 16px 20px 16px', WebkitAppRegion: 'drag', borderBottom: '1px solid var(--border)' }}>
                <h3 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Servers
                </h3>
            </div>

            {/* List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
                {servers.map(server => (
                    <div
                        key={server.id}
                        onClick={() => onSelectServer(server)}
                        className="server-item"
                        style={{
                            padding: '10px 12px',
                            borderRadius: '8px',
                            marginBottom: '8px',
                            cursor: 'pointer',
                            background: currentServerId === server.id ? 'var(--accent)' : 'transparent',
                            color: currentServerId === server.id ? 'white' : 'var(--text-secondary)',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            group: 'server-group'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                            <HardDrive size={16} />
                            <div style={{ fontWeight: '500', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {server.alias || server.url.split('/').pop() || 'Untitled'}
                            </div>
                        </div>

                        {/* Delete button only shows on hover (handled by CSS ideally, but simplified here) */}
                        <button
                            onClick={(e) => { e.stopPropagation(); onDeleteServer(server.id); }}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'inherit',
                                opacity: 0.6,
                                cursor: 'pointer',
                                padding: '4px'
                            }}
                            title="Remove Server"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                ))}
            </div>

            {/* Add Button */}
            <div style={{ padding: '16px', borderTop: '1px solid var(--border)' }}>
                <button
                    className="btn"
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'var(--bg-hover)', color: 'var(--text-primary)' }}
                    onClick={onAddServer}
                >
                    <Plus size={16} /> Add Server
                </button>
            </div>
        </div>
    );
}
