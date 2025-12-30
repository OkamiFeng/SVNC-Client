import React, { useState, useEffect } from 'react';
import { Server, User, Lock, ArrowRight, Save } from 'lucide-react';

export default function ServerForm({ onConnect, initialData }) {
    const [url, setUrl] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [alias, setAlias] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (initialData) {
            setUrl(initialData.url || '');
            setUsername(initialData.username || '');
            setPassword(initialData.password || '');
            setAlias(initialData.alias || '');
        } else {
            // Reset
            setUrl('');
            setUsername('');
            setPassword('');
            setAlias('');
        }
    }, [initialData]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!url) return;
        setLoading(true);
        await onConnect({ id: initialData?.id || Date.now().toString(), url, username, password, alias });
        setLoading(false);
    };

    return (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%' }}>
            <div className="glass-panel" style={{ padding: '40px', width: '100%', maxWidth: '400px', WebkitAppRegion: 'no-drag' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '8px' }}>
                    {initialData ? 'Edit Connection' : 'New Connection'}
                </h2>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '24px' }}>

                    <div style={{ position: 'relative' }}>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Server URL</label>
                        <div style={{ position: 'relative' }}>
                            <Server size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                            <input
                                type="text"
                                className="input"
                                style={{ paddingLeft: '40px' }}
                                placeholder="https://svn.example.com/repo"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Username</label>
                            <input
                                type="text"
                                className="input"
                                placeholder="Optional"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Password</label>
                            <input
                                type="password"
                                className="input"
                                placeholder="Optional"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Alias (Name)</label>
                        <input
                            type="text"
                            className="input"
                            placeholder="e.g. Work Project"
                            value={alias}
                            onChange={(e) => setAlias(e.target.value)}
                        />
                    </div>

                    <button type="submit" className="btn" style={{ marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} disabled={loading}>
                        {loading ? 'Connecting...' : <>{initialData ? 'Update & Connect' : 'Connect'} <ArrowRight size={18} /></>}
                    </button>
                </form>
            </div>
        </div>
    );
}
