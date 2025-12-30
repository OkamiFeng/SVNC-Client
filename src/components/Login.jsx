import React, { useState } from 'react';
import { Server, User, Lock, ArrowRight } from 'lucide-react';

export default function Login({ onConnect }) {
    const [url, setUrl] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!url) return;
        setLoading(true);
        await onConnect({ url, username, password });
        setLoading(false);
    };

    return (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <div className="glass-panel" style={{ padding: '40px', width: '100%', maxWidth: '400px', WebkitAppRegion: 'no-drag' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '8px' }}>SVN Connect</h2>
                <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '32px', fontSize: '0.9rem' }}>
                    Connect to your Subversion repository
                </p>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ position: 'relative' }}>
                        <Server size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                        <input
                            type="text"
                            className="input"
                            style={{ paddingLeft: '40px' }}
                            placeholder="Repository URL"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            required
                        />
                    </div>

                    <div style={{ position: 'relative' }}>
                        <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                        <input
                            type="text"
                            className="input"
                            style={{ paddingLeft: '40px' }}
                            placeholder="Username (optional)"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>

                    <div style={{ position: 'relative' }}>
                        <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                        <input
                            type="password"
                            className="input"
                            style={{ paddingLeft: '40px' }}
                            placeholder="Password (optional)"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <button type="submit" className="btn" style={{ marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} disabled={loading}>
                        {loading ? 'Connecting...' : <>Connect <ArrowRight size={18} /></>}
                    </button>
                </form>
            </div>
        </div>
    );
}
