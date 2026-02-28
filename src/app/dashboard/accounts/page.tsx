'use client';
import { useState, useEffect } from 'react';

interface Account {
    id: string;
    name: string;
    type: 'CASH' | 'BANK' | 'CREDIT_CARD';
    balance: number;
    limit: number | null;
    closingDay: number | null;
    dueDay: number | null;
    color: string;
    icon: string;
    usedLimit?: number;
    availableLimit?: number;
    utilizationPercent?: number;
    createdAt: string;
}

export default function AccountsPage() {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({
        name: '',
        type: 'BANK' as 'CASH' | 'BANK' | 'CREDIT_CARD',
        balance: '0',
        limit: '',
        closingDay: '25',
        dueDay: '10',
        color: '#6366f1',
        icon: '🏦'
    });

    const loadAccounts = () => {
        fetch('/api/accounts').then(r => r.json()).then(data => {
            setAccounts(Array.isArray(data) ? data : []);
            setLoading(false);
        });
    };

    useEffect(() => { loadAccounts(); }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await fetch('/api/accounts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form)
        });
        setShowModal(false);
        setForm({
            name: '',
            type: 'BANK',
            balance: '0',
            limit: '',
            closingDay: '25',
            dueDay: '10',
            color: '#6366f1',
            icon: '🏦'
        });
        loadAccounts();
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Remover esta conta?')) return;
        await fetch(`/api/accounts?id=${id}`, { method: 'DELETE' });
        loadAccounts();
    };

    const fmt = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const getIcon = (type: string) => {
        switch (type) {
            case 'CASH': return '💵';
            case 'BANK': return '🏦';
            case 'CREDIT_CARD': return '💳';
            default: return '💰';
        }
    };

    const colors = [
        { hex: '#6366f1', name: 'Indigo' },
        { hex: '#10b981', name: 'Green' },
        { hex: '#ef4444', name: 'Red' },
        { hex: '#f59e0b', name: 'Amber' },
        { hex: '#8b5cf6', name: 'Purple' },
        { hex: '#ec4899', name: 'Pink' },
        { hex: '#14b8a6', name: 'Teal' },
        { hex: '#3b82f6', name: 'Blue' }
    ];

    const icons = ['💵', '🏦', '💳', '🏠', '🚗', '✈️', '🎁', '📱'];

    const totalBalance = accounts
        .filter(a => a.type !== 'CREDIT_CARD')
        .reduce((sum, a) => sum + a.balance, 0);

    const totalCreditCardLimit = accounts
        .filter(a => a.type === 'CREDIT_CARD')
        .reduce((sum, a) => sum + (a.limit || 0), 0);

    const totalCreditCardUsed = accounts
        .filter(a => a.type === 'CREDIT_CARD')
        .reduce((sum, a) => sum + (a.usedLimit || 0), 0);

    return (
        <div className="animate-fade">
            <div className="page-header">
                <h1>🏦 Contas</h1>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    ➕ Nova Conta
                </button>
            </div>

            <div className="card" style={{ marginBottom: '1.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    💰 <strong>Contas representam onde seu dinheiro está armazenado:</strong> banco, carteira ou cartão de crédito. gerencie todas as suas contas em um só lugar.
                </p>
            </div>

            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div className="card" style={{ padding: '1.25rem' }}>
                    <div className="text-sm text-muted">Saldo Total</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--success)' }}>
                        {fmt(totalBalance)}
                    </div>
                </div>
                <div className="card" style={{ padding: '1.25rem' }}>
                    <div className="text-sm text-muted">Limite Cartões</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--primary)' }}>
                        {fmt(totalCreditCardLimit)}
                    </div>
                </div>
                <div className="card" style={{ padding: '1.25rem' }}>
                    <div className="text-sm text-muted">Usado no Cartão</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--danger)' }}>
                        {fmt(totalCreditCardUsed)}
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="skeleton" style={{ height: 200, borderRadius: 'var(--radius-lg)' }} />
            ) : accounts.length === 0 ? (
                <div className="empty-state card">
                    <div className="empty-state-icon">🏦</div>
                    <h3>Nenhuma conta cadastrada</h3>
                    <p>Adicione sua primeira conta bancária ou cartão!</p>
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>➕ Adicionar</button>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                    {accounts.map(account => (
                        <div key={account.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                            <div style={{ 
                                background: account.color, 
                                padding: '1.5rem',
                                color: 'white'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{account.icon}</div>
                                        <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{account.name}</div>
                                        <div style={{ fontSize: '0.85rem', opacity: 0.8, marginTop: '0.25rem' }}>
                                            {account.type === 'CASH' && 'Dinheiro'}
                                            {account.type === 'BANK' && 'Conta Bancária'}
                                            {account.type === 'CREDIT_CARD' && 'Cartão de Crédito'}
                                        </div>
                                    </div>
                                    <button 
                                        className="btn btn-sm" 
                                        style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}
                                        onClick={() => handleDelete(account.id)}
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                            <div style={{ padding: '1rem' }}>
                                {account.type === 'CREDIT_CARD' ? (
                                    <>
                                        <div style={{ marginBottom: '0.75rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                                                <span className="text-muted">Utilizado</span>
                                                <span>{fmt(account.usedLimit || 0)}</span>
                                            </div>
                                            <div style={{ height: 8, background: 'var(--bg-secondary)', borderRadius: 4, overflow: 'hidden' }}>
                                                <div style={{ 
                                                    width: `${Math.min(account.utilizationPercent || 0, 100)}%`, 
                                                    height: '100%', 
                                                    background: (account.utilizationPercent || 0) > 80 ? 'var(--danger)' : (account.utilizationPercent || 0) > 50 ? '#f59e0b' : 'var(--success)',
                                                    transition: 'width 0.3s'
                                                }} />
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                                            <span className="text-muted">Fechamento: dia {account.closingDay}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                                            <span className="text-muted">Vencimento: dia {account.dueDay}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
                                            <span style={{ fontWeight: 600 }}>Disponível</span>
                                            <span style={{ fontWeight: 700, color: 'var(--success)' }}>{fmt(account.availableLimit || 0)}</span>
                                        </div>
                                    </>
                                ) : (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontWeight: 600 }}>Saldo</span>
                                        <span style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--success)' }}>
                                            {fmt(account.balance)}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal - Nova Conta */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>🏦 Nova Conta</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Tipo de Conta</label>
                                <select 
                                    className="form-select"
                                    value={form.type}
                                    onChange={e => setForm({...form, type: e.target.value as any, icon: getIcon(e.target.value)})}
                                >
                                    <option value="BANK">🏦 Conta Bancária</option>
                                    <option value="CASH">💵 Dinheiro</option>
                                    <option value="CREDIT_CARD">💳 Cartão de Crédito</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Nome da Conta</label>
                                <input 
                                    className="form-input" 
                                    type="text" 
                                    placeholder={form.type === 'CREDIT_CARD' ? 'Ex: Nubank, Itaú...' : 'Ex: Conta Principal, Cofrinho...'} 
                                    value={form.name} 
                                    onChange={e => setForm({...form, name: e.target.value})} 
                                    required 
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Ícone</label>
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    {icons.map(icon => (
                                        <div 
                                            key={icon} 
                                            onClick={() => setForm({...form, icon})}
                                            style={{
                                                width: 40, 
                                                height: 40, 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                justifyContent: 'center',
                                                fontSize: '1.25rem',
                                                borderRadius: 8, 
                                                cursor: 'pointer',
                                                background: form.icon === icon ? 'var(--primary)' : 'var(--bg-secondary)',
                                                border: form.icon === icon ? '2px solid var(--primary)' : '2px solid transparent'
                                            }}
                                        >
                                            {icon}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Cor</label>
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    {colors.map(c => (
                                        <div 
                                            key={c.hex} 
                                            onClick={() => setForm({...form, color: c.hex})}
                                            style={{
                                                width: 32, 
                                                height: 32, 
                                                borderRadius: '50%', 
                                                background: c.hex, 
                                                cursor: 'pointer',
                                                border: form.color === c.hex ? '3px solid white' : 'none',
                                                boxShadow: form.color === c.hex ? `0 0 0 2px ${c.hex}` : 'none'
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>

                            {form.type !== 'CREDIT_CARD' && (
                                <div className="form-group">
                                    <label className="form-label">Saldo Inicial (R$)</label>
                                    <input 
                                        className="form-input" 
                                        type="number" 
                                        step="0.01"
                                        placeholder="0,00" 
                                        value={form.balance} 
                                        onChange={e => setForm({...form, balance: e.target.value})} 
                                    />
                                </div>
                            )}

                            {form.type === 'CREDIT_CARD' && (
                                <>
                                    <div className="form-group">
                                        <label className="form-label">Limite (R$)</label>
                                        <input 
                                            className="form-input" 
                                            type="number" 
                                            step="0.01"
                                            placeholder="5000,00" 
                                            value={form.limit} 
                                            onChange={e => setForm({...form, limit: e.target.value})} 
                                            required 
                                        />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div className="form-group">
                                            <label className="form-label">Dia Fechamento</label>
                                            <input 
                                                className="form-input" 
                                                type="number" 
                                                min="1" 
                                                max="31" 
                                                value={form.closingDay} 
                                                onChange={e => setForm({...form, closingDay: e.target.value})} 
                                                required 
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Dia Vencimento</label>
                                            <input 
                                                className="form-input" 
                                                type="number" 
                                                min="1" 
                                                max="31" 
                                                value={form.dueDay} 
                                                onChange={e => setForm({...form, dueDay: e.target.value})} 
                                                required 
                                            />
                                        </div>
                                    </div>
                                </>
                            )}

                            <button className="btn btn-primary w-full" type="submit">💾 Salvar</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
