'use client';
import { useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import InstallAppButton from '@/components/InstallAppButton';

interface DashboardLayoutProps {
    children: ReactNode;
}

const NAV_ITEMS = [
    { href: '/dashboard', icon: '📊', label: 'Dashboard' },
    { href: '/dashboard/transactions', icon: '💳', label: 'Transações' },
    { href: '/dashboard/accounts', icon: '🏦', label: 'Contas' },
    { href: '/dashboard/credit-cards', icon: '💳', label: 'Cartões' },
    { href: '/dashboard/categories', icon: '🏷️', label: 'Categorias' },
    { href: '/dashboard/family', icon: '👨‍👩‍👧‍👦', label: 'Família' },
    { href: '/dashboard/cfo', icon: '🤖', label: 'CFO IA' },
    { href: '/dashboard/chat', icon: '💬', label: 'Chat' },
    { href: '/dashboard/gamification', icon: '🏆', label: 'Gamificação' },
    { href: '/dashboard/settings', icon: '⚙️', label: 'Configurações' },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [theme, setTheme] = useState('dark');
    const [user, setUser] = useState<any>(null);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // Check auth
        fetch('/api/auth/session')
            .then(r => r.json())
            .then(data => {
                if (!data.authenticated) router.push('/');
                else setUser(data.user);
            })
            .catch(() => router.push('/'));
    }, [router]);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    const handleLogout = async () => {
        await fetch('/api/auth/session', { method: 'POST' });
        router.push('/');
    };

    if (!user) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
                <div className="skeleton" style={{ width: 200, height: 24, marginBottom: 8 }}></div>
            </div>
        );
    }

    return (
        <div className="app-layout">
            <button className="mobile-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
                {sidebarOpen ? '✕' : '☰'}
            </button>

            <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <div className="sidebar-logo">
                        <div className="sidebar-logo-icon">💰</div>
                        <span className="sidebar-logo-text">FinFamily</span>
                    </div>
                </div>

                <nav className="sidebar-nav" style={{ flex: 1 }}>
                    {NAV_ITEMS.map(item => (
                        <a
                            key={item.href}
                            href={item.href}
                            className={`nav-item ${pathname === item.href ? 'active' : ''}`}
                            onClick={(e) => {
                                e.preventDefault();
                                router.push(item.href);
                                setSidebarOpen(false);
                            }}
                        >
                            <span className="nav-item-icon">{item.icon}</span>
                            {item.label}
                        </a>
                    ))}
                </nav>

                <div style={{ padding: '1rem 0.75rem', borderTop: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 1rem', marginBottom: '0.5rem' }}>
                        <div 
                            className="avatar"
                            style={{
                                width: 36,
                                height: 36,
                                borderRadius: '50%',
                                overflow: 'hidden',
                                background: user.avatar ? 'transparent' : 'var(--primary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                            }}
                        >
                            {user.avatar ? (
                                <img 
                                    src={user.avatar} 
                                    alt="Avatar" 
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            ) : (
                                user.name?.[0]?.toUpperCase()
                            )}
                        </div>
                        <div>
                            <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{user.name}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{user.role === 'ADMIN' ? 'Admin' : 'Membro'}</div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1rem' }}>
                        <div
                            className={`theme-toggle ${theme === 'light' ? 'light' : ''}`}
                            onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
                            title="Alternar tema"
                        />
                        <button onClick={handleLogout} className="btn btn-sm btn-secondary" style={{ fontSize: '0.75rem' }}>
                            Sair
                        </button>
                    </div>
                </div>
            </aside>

            <main className="main-content">
                {children}
            </main>
            <InstallAppButton />
        </div>
    );
}
