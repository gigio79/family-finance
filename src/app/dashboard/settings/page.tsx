'use client';
import { useState, useEffect, useRef } from 'react';

export default function SettingsPage() {
    const [user, setUser] = useState<any>(null);
    const [familyName, setFamilyName] = useState('');
    const [inviteEmail, setInviteEmail] = useState('');
    const [message, setMessage] = useState('');
    
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [editName, setEditName] = useState('');
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetch('/api/auth/session').then(r => r.json()).then(data => {
            if (data.authenticated) {
                setUser(data.user);
                setEditName(data.user?.name || '');
                setAvatarPreview(data.user?.avatar || null);
            }
        });
    }, []);

    const handleSaveProfile = async () => {
        const res = await fetch('/api/auth/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: editName, avatar: avatarPreview })
        });
        
        if (res.ok) {
            const data = await res.json();
            setUser(data.user);
            setIsEditingProfile(false);
            setMessage('Perfil atualizado!');
            setTimeout(() => setMessage(''), 3000);
        }
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const cancelEdit = () => {
        setEditName(user?.name || '');
        setAvatarPreview(user?.avatar || null);
        setIsEditingProfile(false);
    };

    return (
        <div className="animate-fade">
            <div className="page-header">
                <h1>Configurações</h1>
            </div>

            {message && (
                <div className="alert alert-success" style={{ marginBottom: '1rem' }}>
                    {message}
                </div>
            )}

            {/* Profile */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ marginBottom: '1rem' }}>Perfil</h3>
                
                {!isEditingProfile ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <div 
                            className="avatar avatar-lg"
                            style={{
                                width: 80,
                                height: 80,
                                borderRadius: '50%',
                                overflow: 'hidden',
                                background: user?.avatar ? 'transparent' : 'var(--primary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '2rem',
                                flexShrink: 0
                            }}
                        >
                            {user?.avatar ? (
                                <img 
                                    src={user.avatar} 
                                    alt="Avatar" 
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            ) : (
                                user?.name?.[0]?.toUpperCase()
                            )}
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{user?.name}</div>
                            <div className="text-sm text-muted">{user?.email}</div>
                            <span className="badge badge-confirmed" style={{ marginTop: '0.25rem' }}>
                                {user?.role === 'ADMIN' ? 'Administrador' : 'Membro'}
                            </span>
                        </div>
                        <button className="btn btn-secondary" onClick={() => setIsEditingProfile(true)}>
                            Editar
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                            <div 
                                className="avatar avatar-lg"
                                style={{
                                    width: 80,
                                    height: 80,
                                    borderRadius: '50%',
                                    overflow: 'hidden',
                                    background: avatarPreview ? 'transparent' : 'var(--primary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '2rem',
                                    flexShrink: 0,
                                    cursor: 'pointer',
                                    border: '2px dashed var(--border)'
                                }}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {avatarPreview ? (
                                    <img 
                                        src={avatarPreview} 
                                        alt="Avatar preview" 
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                ) : (
                                    '+'
                                )}
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                accept="image/*"
                                onChange={handleAvatarChange}
                                style={{ display: 'none' }}
                            />
                            <div style={{ flex: 1 }}>
                                <label className="form-label">Nome</label>
                                <input
                                    className="form-input"
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    placeholder="Seu nome"
                                />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button className="btn btn-primary" onClick={handleSaveProfile}>
                                Salvar
                            </button>
                            <button className="btn btn-secondary" onClick={cancelEdit}>
                                Cancelar
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Integrations */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ margin: 0 }}>Integrações de Automação</h3>
                    <span className="badge badge-confirmed">Neural Engine v2</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* Gmail / Webhook Section */}
                    <div style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)', background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                            <span style={{ fontSize: '2rem' }}>📧</span>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>Automação via Email (Gmail / Bank)</div>
                                <div className="text-sm text-muted">Capture gastos do banco automaticamente usando n8n ou Zapier.</div>
                            </div>
                            <span className="badge badge-confirmed" style={{ marginLeft: 'auto' }}>Ativo</span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
                            <div>
                                <label className="text-xs text-muted" style={{ display: 'block', marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Seu User ID (Necessário para n8n)</label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <input
                                        readOnly
                                        value={user?.id || ''}
                                        style={{ flex: 1, padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                                    />
                                    <button className="btn btn-secondary" onClick={() => navigator.clipboard.writeText(user?.id || '')}>Copiar</button>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs text-muted" style={{ display: 'block', marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>URL do Webhook</label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <input
                                        readOnly
                                        value={`${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/api/webhooks/transactions`}
                                        style={{ flex: 1, padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                                    />
                                    <button className="btn btn-secondary" onClick={() => navigator.clipboard.writeText(`${window.location.origin}/api/webhooks/transactions`)}>Copiar</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* About */}
            <div className="card" style={{ opacity: 0.8 }}>
                <h3 style={{ marginBottom: '0.5rem' }}>Sobre</h3>
                <p className="text-sm text-muted">
                    <strong>FinFamily v1.0</strong> — Sistema de Gestão Financeira Familiar Inteligente.<br />
                    Arquitetura modular preparada para evolução.<br />
                    100% gratuito.
                </p>
            </div>
        </div>
    );
}
