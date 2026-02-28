'use client';
import { useState, useEffect } from 'react';

export default function SettingsPage() {
    const [user, setUser] = useState<any>(null);
    const [familyName, setFamilyName] = useState('');
    const [inviteEmail, setInviteEmail] = useState('');
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetch('/api/auth/session').then(r => r.json()).then(data => {
            if (data.authenticated) setUser(data.user);
        });
    }, []);

    return (
        <div className="animate-fade">
            <div className="page-header">
                <h1>⚙️ Configurações</h1>
            </div>

            {/* Profile */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ marginBottom: '1rem' }}>👤 Perfil</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div className="avatar avatar-lg">{user?.name?.[0]?.toUpperCase()}</div>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{user?.name}</div>
                        <div className="text-sm text-muted">{user?.email}</div>
                        <span className="badge badge-confirmed" style={{ marginTop: '0.25rem' }}>
                            {user?.role === 'ADMIN' ? '👑 Administrador' : '👤 Membro'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Integrations */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ margin: 0 }}>🔌 Integrações de Automação</h3>
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
                                        value={`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/webhooks/transactions`}
                                        style={{ flex: 1, padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                                    />
                                    <button className="btn btn-secondary" onClick={() => navigator.clipboard.writeText(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/webhooks/transactions`)}>Copiar</button>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs text-muted" style={{ display: 'block', marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Webhook Secret</label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <input
                                        type="password"
                                        readOnly
                                        value={process.env.NEXT_PUBLIC_WEBHOOK_SECRET || 'fin_secret_a1b2c3d4e5f6'}
                                        style={{ flex: 1, padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                                    />
                                    <button className="btn btn-secondary" onClick={() => navigator.clipboard.writeText(process.env.NEXT_PUBLIC_WEBHOOK_SECRET || 'fin_secret_a1b2c3d4e5f6')}>Copiar</button>
                                </div>
                            </div>

                            <div className="text-sm text-muted" style={{ padding: '0.75rem', borderRadius: '8px', background: 'rgba(0,0,0,0.1)', marginTop: '0.5rem' }}>
                                💡 **Como configurar:** Crie um fluxo no n8n que monitore seu Gmail e envie o conteúdo do email (body) para esta URL via POST, incluindo o cabeçalho `x-webhook-secret`.
                            </div>
                        </div>
                    </div>

                    {/* Other Integrations (Simplified) */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                        {[
                            { name: 'WhatsApp', icon: '💬', status: 'Futuro', desc: 'Integração direta planejada.' },
                            { name: 'Telegram Bot', icon: '🤖', status: 'Preparado', desc: 'Configuração via Token CLI.' },
                        ].map((integration, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-secondary)', border: '1px dashed var(--border)' }}>
                                <span style={{ fontSize: '1.5rem' }}>{integration.icon}</span>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{integration.name}</div>
                                    <div className="text-xs text-muted">{integration.desc}</div>
                                </div>
                                <span className="badge badge-pending" style={{ fontSize: '0.65rem' }}>{integration.status}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* About */}
            <div className="card" style={{ opacity: 0.8 }}>
                <h3 style={{ marginBottom: '0.5rem' }}>ℹ️ Sobre</h3>
                <p className="text-sm text-muted">
                    <strong>FinFamily v1.0</strong> — Sistema de Gestão Financeira Familiar Inteligente.<br />
                    Arquitetura modular preparada para evolução SaaS.<br />
                    100% gratuito, sem dependência de APIs pagas.
                </p>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
                    <span className="badge badge-confirmed">Next.js</span>
                    <span className="badge badge-confirmed">SQLite</span>
                    <span className="badge badge-confirmed">Prisma</span>
                    <span className="badge badge-confirmed">JWT</span>
                    <span className="badge badge-confirmed">Recharts</span>
                </div>
            </div>
        </div>
    );
}
