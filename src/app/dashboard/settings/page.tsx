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
                <h3 style={{ marginBottom: '1rem' }}>🔌 Integrações</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {[
                        { name: 'Gmail', icon: '📧', status: 'Preparado', desc: 'Captura automática de gastos via email', available: false },
                        { name: 'Telegram Bot', icon: '🤖', status: 'Preparado', desc: 'Registre gastos e consulte saldo pelo Telegram', available: false },
                        { name: 'WhatsApp', icon: '💬', status: 'Futuro', desc: 'Integração planejada para versão futura', available: false },
                        { name: 'Web Push', icon: '🔔', status: 'Preparado', desc: 'Notificações em tempo real no navegador', available: false },
                    ].map((integration, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-secondary)' }}>
                            <span style={{ fontSize: '2rem' }}>{integration.icon}</span>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 600 }}>{integration.name}</div>
                                <div className="text-sm text-muted">{integration.desc}</div>
                            </div>
                            <span className="badge badge-pending">{integration.status}</span>
                        </div>
                    ))}
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
