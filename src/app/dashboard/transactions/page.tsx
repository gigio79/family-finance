'use client';
import { useState, useEffect } from 'react';

interface Transaction {
    id: string;
    amount: number;
    description: string;
    date: string;
    type: string;
    status: string;
    source: string;
    recurring: boolean;
    category: { id: string; name: string; icon: string; color: string } | null;
    user: { id: string; name: string };
}

interface Category {
    id: string;
    name: string;
    icon: string;
    color: string;
}

export default function TransactionsPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingTx, setEditingTx] = useState<Transaction | null>(null);
    const [filterType, setFilterType] = useState('');
    const [filterCategory, setFilterCategory] = useState('');

    // Form state
    const [form, setForm] = useState({
        amount: '', description: '', date: new Date().toISOString().split('T')[0],
        type: 'EXPENSE', categoryId: '', recurring: false, recurringInterval: '',
    });

    const loadData = () => {
        const params = new URLSearchParams();
        if (filterType) params.set('type', filterType);
        if (filterCategory) params.set('categoryId', filterCategory);

        Promise.all([
            fetch(`/api/transactions?${params}`).then(r => r.json()),
            fetch('/api/categories').then(r => r.json()),
        ]).then(([txs, cats]) => {
            setTransactions(Array.isArray(txs) ? txs : []);
            setCategories(Array.isArray(cats) ? cats : []);
            setLoading(false);
        });
    };

    useEffect(() => { loadData(); }, [filterType, filterCategory]);

    const fmt = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const method = editingTx ? 'PUT' : 'POST';
        const body = editingTx ? { id: editingTx.id, ...form } : form;

        await fetch('/api/transactions', {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        setShowModal(false);
        setEditingTx(null);
        setForm({ amount: '', description: '', date: new Date().toISOString().split('T')[0], type: 'EXPENSE', categoryId: '', recurring: false, recurringInterval: '' });
        loadData();
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Remover esta transação?')) return;
        await fetch(`/api/transactions?id=${id}`, { method: 'DELETE' });
        loadData();
    };

    const openEdit = (tx: Transaction) => {
        setEditingTx(tx);
        setForm({
            amount: tx.amount.toString(),
            description: tx.description,
            date: tx.date.split('T')[0],
            type: tx.type,
            categoryId: tx.category?.id || '',
            recurring: tx.recurring,
            recurringInterval: '',
        });
        setShowModal(true);
    };

    return (
        <div className="animate-fade">
            <div className="page-header">
                <h1>💳 Transações</h1>
                <button className="btn btn-primary" onClick={() => { setEditingTx(null); setForm({ amount: '', description: '', date: new Date().toISOString().split('T')[0], type: 'EXPENSE', categoryId: '', recurring: false, recurringInterval: '' }); setShowModal(true); }}>
                    ➕ Nova Transação
                </button>
            </div>

            {/* Filters */}
            <div className="filters-bar">
                <div className={`filter-chip ${filterType === '' ? 'active' : ''}`} onClick={() => setFilterType('')}>📋 Todas</div>
                <div className={`filter-chip ${filterType === 'INCOME' ? 'active' : ''}`} onClick={() => setFilterType('INCOME')}>📈 Receitas</div>
                <div className={`filter-chip ${filterType === 'EXPENSE' ? 'active' : ''}`} onClick={() => setFilterType('EXPENSE')}>📉 Despesas</div>
                <select className="form-select" value={filterCategory} onChange={e => setFilterCategory(e.target.value)} style={{ maxWidth: 200 }}>
                    <option value="">Todas categorias</option>
                    {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                    ))}
                </select>
            </div>

            {/* Table */}
            {loading ? (
                <div className="skeleton" style={{ height: 300, borderRadius: 'var(--radius-lg)' }} />
            ) : transactions.length === 0 ? (
                <div className="empty-state card">
                    <div className="empty-state-icon">💸</div>
                    <h3>Nenhuma transação encontrada</h3>
                    <p>Comece registrando sua primeira transação!</p>
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>➕ Adicionar</button>
                </div>
            ) : (
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Descrição</th>
                                <th>Categoria</th>
                                <th>Valor</th>
                                <th>Status</th>
                                <th>Usuário</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.map(tx => (
                                <tr key={tx.id}>
                                    <td>{new Date(tx.date).toLocaleDateString('pt-BR')}</td>
                                    <td>
                                        <div style={{ fontWeight: 600 }}>{tx.description}</div>
                                        {tx.recurring && <span className="badge badge-pending" style={{ marginTop: 2 }}>🔄 Recorrente</span>}
                                    </td>
                                    <td>
                                        {tx.category ? (
                                            <span className="badge" style={{ background: `${tx.category.color}20`, color: tx.category.color }}>
                                                {tx.category.icon} {tx.category.name}
                                            </span>
                                        ) : <span className="text-muted">—</span>}
                                    </td>
                                    <td>
                                        <span style={{ fontWeight: 700, color: tx.type === 'INCOME' ? 'var(--success)' : 'var(--danger)' }}>
                                            {tx.type === 'INCOME' ? '+' : '-'}{fmt(tx.amount)}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`badge ${tx.status === 'CONFIRMED' ? 'badge-confirmed' : 'badge-pending'}`}>
                                            {tx.status === 'CONFIRMED' ? '✅' : '⏳'} {tx.status === 'CONFIRMED' ? 'Confirmada' : 'Pendente'}
                                        </span>
                                    </td>
                                    <td className="text-sm text-muted">{tx.user.name}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                                            <button className="btn btn-sm btn-secondary" onClick={() => openEdit(tx)} title="Editar">✏️</button>
                                            <button className="btn btn-sm btn-danger" onClick={() => handleDelete(tx.id)} title="Remover">🗑️</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingTx ? '✏️ Editar Transação' : '➕ Nova Transação'}</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Tipo</label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <div className={`filter-chip ${form.type === 'EXPENSE' ? 'active' : ''}`} onClick={() => setForm({ ...form, type: 'EXPENSE' })}>📉 Despesa</div>
                                    <div className={`filter-chip ${form.type === 'INCOME' ? 'active' : ''}`} onClick={() => setForm({ ...form, type: 'INCOME' })}>📈 Receita</div>
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Valor (R$)</label>
                                <input className="form-input" type="number" step="0.01" placeholder="0,00" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Descrição</label>
                                <input className="form-input" type="text" placeholder="Ex: Supermercado, Salário..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Data</label>
                                <input className="form-input" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Categoria</label>
                                <select className="form-select" value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })}>
                                    <option value="">Sem categoria</option>
                                    {categories.map(c => (
                                        <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                    <input type="checkbox" checked={form.recurring} onChange={e => setForm({ ...form, recurring: e.target.checked })} />
                                    <span className="form-label" style={{ margin: 0 }}>🔄 Transação recorrente</span>
                                </label>
                            </div>
                            <button className="btn btn-primary w-full" type="submit">
                                {editingTx ? '💾 Salvar' : '✅ Registrar'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
