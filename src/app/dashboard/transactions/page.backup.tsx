// Backup of original transactions page prior to large edits.
// If anything goes wrong, we can restore from here.

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
    isInstallment: boolean;
    installmentGroupId: string | null;
    installmentNumber: number | null;
    totalInstallments: number | null;
    creditCardId: string | null;
    creditCard: { id: string; name: string; icon: string; color: string } | null;
    category: { id: string; name: string; icon: string; color: string } | null;
    user: { id: string; name: string };
}

interface Category {
    id: string;
    name: string;
    type: string;
    icon: string;
    color: string;
}

interface CreditCard {
    id: string;
    name: string;
    icon: string;
    color: string;
}

export default function TransactionsPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showInstallmentsModal, setShowInstallmentsModal] = useState(false);
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
    const [installments, setInstallments] = useState<Transaction[]>([]);
    const [editingTx, setEditingTx] = useState<Transaction | null>(null);
    const [filterType, setFilterType] = useState('');
    const [filterCategory, setFilterCategory] = useState('');

    const [form, setForm] = useState({
        amount: '', description: '', date: new Date().toISOString().split('T')[0],
        type: 'EXPENSE', categoryId: '', recurring: false, recurringInterval: '',
        isInstallment: false, totalInstallments: 2, firstInstallmentDate: new Date().toISOString().split('T')[0],
        creditCardId: ''
    });

    const loadData = () => {
        const params = new URLSearchParams();
        if (filterType) params.set('type', filterType);
        if (filterCategory) params.set('categoryId', filterCategory);

        Promise.all([
            fetch(`/api/transactions?${params}`).then(r => r.json()),
            fetch('/api/categories').then(r => r.json()),
            fetch('/api/credit-cards').then(r => r.json()),
        ]).then(([txs, cats, cards]) => {
            setTransactions(Array.isArray(txs) ? txs : []);
            setCategories(Array.isArray(cats) ? cats : []);
            setCreditCards(Array.isArray(cards) ? cards : []);
            setLoading(false);
        });
    };

    useEffect(() => { loadData(); }, [filterType, filterCategory]);

    const fmt = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const filteredCategories = categories.filter(c => c.type === form.type);

    const handleTypeChange = (newType: string) => {
        setForm({ 
            ...form, 
            type: newType, 
            categoryId: '',
            isInstallment: newType === 'INCOME' ? false : form.isInstallment,
            creditCardId: newType === 'INCOME' ? '' : form.creditCardId
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (form.isInstallment && form.type === 'INCOME') {
            alert('Parcelamento não disponível para receitas!');
            return;
        }
        
        const payload = {
            ...form,
            creditCardId: form.type === 'EXPENSE' && form.creditCardId ? form.creditCardId : null,
            totalInstallments: form.isInstallment ? parseInt(form.totalInstallments as any) : null,
            firstInstallmentDate: form.isInstallment ? form.firstInstallmentDate : null
        };

        const method = editingTx ? 'PUT' : 'POST';
        const body = editingTx ? { id: editingTx.id, ...payload } : payload;

        const res = await fetch('/api/transactions', {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        if (res.ok) {
            setShowModal(false);
            setEditingTx(null);
            setForm({ 
                amount: '', description: '', date: new Date().toISOString().split('T')[0], 
                type: 'EXPENSE', categoryId: '', recurring: false, recurringInterval: '',
                isInstallment: false, totalInstallments: 2, firstInstallmentDate: new Date().toISOString().split('T')[0], creditCardId: ''
            });
            loadData();
        }
    };

    const handleDelete = async (id: string, installmentGroupId?: string | null) => {
        if (installmentGroupId) {
            if (!confirm('Cancelar todas as parcelas futuras?')) return;
            await fetch(`/api/transactions?installmentGroupId=${installmentGroupId}&cancelFrom=1`, { method: 'DELETE' });
        } else {
            if (!confirm('Remover esta transação?')) return;
            await fetch(`/api/transactions?id=${id}`, { method: 'DELETE' });
        }
        loadData();
    };

    const openEdit = (tx: Transaction) => {
        setEditingTx(tx);
        setForm({
            amount: tx.amount.toString(),
            description: tx.description.replace(/ \(\d+\/\d+\)/, ''),
            date: tx.date.split('T')[0],
            type: tx.type,
            categoryId: tx.category?.id || '',
            recurring: tx.recurring,
            recurringInterval: '',
            isInstallment: tx.isInstallment,
            totalInstallments: tx.totalInstallments || 2,
            firstInstallmentDate: tx.date.split('T')[0],
            creditCardId: tx.creditCardId || ''
        });
        setShowModal(true);
    };

    const viewInstallments = async (groupId: string) => {
        setSelectedGroupId(groupId);
        const res = await fetch(`/api/transactions?installmentGroupId=${groupId}`);
        const data = await res.json();
        setInstallments(data);
        setShowInstallmentsModal(true);
    };

    const groupedTransactions = transactions.reduce((acc, tx) => {
        if (tx.isInstallment && tx.installmentGroupId) {
            if (!acc[tx.installmentGroupId]) {
                acc[tx.installmentGroupId] = tx;
            }
        } else {
            acc[tx.id] = tx;
        }
        return acc;
    }, {} as Record<string, Transaction>);

    return (
        <div className="animate-fade">
            <div className="page-header">
                <h1>💳 Transações</h1>
                <button className="btn btn-primary" onClick={() => { 
                    setEditingTx(null); 
                    setForm({ 
                        amount: '', description: '', date: new Date().toISOString().split('T')[0], 
                        type: 'EXPENSE', categoryId: '', recurring: false, recurringInterval: '',
                        isInstallment: false, totalInstallments: 2, firstInstallmentDate: new Date().toISOString().split('T')[0], creditCardId: ''
                    }); 
                    setShowModal(true); 
                }}>
                    ➕ Nova Transação
                </button>
            </div>

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

            {loading ? (
                <div className="skeleton" style={{ height: 300, borderRadius: 'var(--radius-lg)' }} />
            ) : Object.keys(groupedTransactions).length === 0 ? (
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
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.values(groupedTransactions).map(tx => (
                                <tr key={tx.id}>
                                    <td>{new Date(tx.date).toLocaleDateString('pt-BR')}</td>
                                    <td>
                                        <div style={{ fontWeight: 600 }}>
                                            {tx.isInstallment ? (
                                                <span 
                                                    style={{ cursor: 'pointer', color: 'var(--primary)', textDecoration: 'underline' }}
                                                    onClick={() => viewInstallments(tx.installmentGroupId!)}
                                                    title="Ver todas as parcelas"
                                                >
                                                    {tx.description.replace(/ \(\d+\/\d+\)/, '')} ({tx.installmentNumber}/{tx.totalInstallments})
                                                </span>
                                            ) : tx.description}
                                        </div>
                                        {tx.recurring && <span className="badge badge-pending" style={{ marginTop: 2 }}>🔄 Recorrente</span>}
                                        {tx.isInstallment && <span className="badge badge-confirmed" style={{ marginTop: 2 }}>📊 Parcelado</span>}
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
                                            {tx.status === 'CONFIRMED' ? '✅' : '⏳'} {tx.status === 'CONFIRMED' ? 'Confirmada' : tx.status === 'CANCELLED' ? '❌ Cancelada' : 'Pendente'}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                                            <button className="btn btn-sm btn-secondary" onClick={() => openEdit(tx)} title="Editar">✏️</button>
                                            <button className="btn btn-sm btn-danger" onClick={() => handleDelete(tx.id, tx.installmentGroupId)} title="Remover">🗑️</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

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
                                    <div 
                                        className={`filter-chip ${form.type === 'EXPENSE' ? 'active' : ''}`} 
                                        onClick={() => handleTypeChange('EXPENSE')}
                                        style={{ flex: 1, textAlign: 'center' }}
                                    >
                                        📉 Despesa
                                    </div>
                                    <div 
                                        className={`filter-chip ${form.type === 'INCOME' ? 'active' : ''}`} 
                                        onClick={() => handleTypeChange('INCOME')}
                                        style={{ flex: 1, textAlign: 'center' }}
                                    >
                                        📈 Receita
                                    </div>
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Valor Total (R$)</label>
                                <input className="form-input" type="number" step="0.01" placeholder="0,00" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Descrição</label>
                                <input className="form-input" type="text" placeholder="Ex: Notebook, TV..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Data</label>
                                <input className="form-input" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value, firstInstallmentDate: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Categoria</label>
                                <select className="form-select" value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })} required>
                                    <option value="">Selecione...</option>
                                    {filteredCategories.map(c => (
                                        <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                                    ))}
                                </select>
                            </div>

                            {form.type === 'EXPENSE' && creditCards.length > 0 && (
                                <div className="form-group">
                                    <label className="form-label">Cartão de Crédito</label>
                                    <select className="form-select" value={form.creditCardId} onChange={e => setForm({ ...form, creditCardId: e.target.value })}>
                                        <option value="">À vista (dinheiro/débito)</option>
                                        {creditCards.map(card => (
                                            <option key={card.id} value={card.id}>{card.icon} {card.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            
                            <div className="form-group" style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
                                <label 
                                    style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '0.5rem', 
                                        cursor: form.type === 'INCOME' ? 'not-allowed' : 'pointer',
                                        opacity: form.type === 'INCOME' ? 0.5 : 1
                                    }}
                                >
                                    <input 
                                        type="checkbox" 
                                        checked={form.isInstallment} 
                                        onChange={e => {
                                            if (form.type === 'INCOME') return;
                                            setForm({ ...form, isInstallment: e.target.checked, totalInstallments: e.target.checked ? form.totalInstallments : 0 });
                                        }}
                                        disabled={form.type === 'INCOME'}
                                    />
                                    <span className="form-label" style={{ margin: 0 }}>📊 Compra parcelada</span>
                                </label>
                                {form.type === 'INCOME' && (
                                    <div className="text-sm text-muted" style={{ marginTop: '0.5rem' }}>
                                        ℹ️ Parcelamento disponível apenas para despesas
                                    </div>
                                )}
                                
                                {form.isInstallment && form.type === 'EXPENSE' && (
                                    <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        <div>
                                            <label className="form-label">Número de parcelas</label>
                                            <select 
                                                className="form-select" 
                                                value={form.totalInstallments} 
                                                onChange={e => setForm({ ...form, totalInstallments: parseInt(e.target.value) })}
                                            >
                                                {[...Array(35)].map((_, i) => (
                                                    <option key={i + 2} value={i + 2}>{i + 2}x</option>
                                                ))}
                                            </select>
                                        </div>
                                        {form.amount && (
                                            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                                Valor por parcela: <strong>{fmt(parseFloat(form.amount) / form.totalInstallments)}</strong>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <button className="btn btn-primary w-full" type="submit">
                                {editingTx ? '💾 Salvar' : '✅ Registrar'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {showInstallmentsModal && (
                <div className="modal-overlay" onClick={() => setShowInstallmentsModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>📊 Todas as Parcelas</h2>
                            <button className="modal-close" onClick={() => setShowInstallmentsModal(false)}>×</button>
                        </div>
                        <div style={{ maxHeight: 400, overflow: 'auto' }}>
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Data</th>
                                        <th>Valor</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {installments.map(tx => (
                                        <tr key={tx.id}>
                                            <td>{tx.installmentNumber}/{tx.totalInstallments}</td>
                                            <td>{new Date(tx.date).toLocaleDateString('pt-BR')}</td>
                                            <td style={{ fontWeight: 700, color: 'var(--danger)' }}>{fmt(tx.amount)}</td>
                                            <td>
                                                <span className={`badge ${tx.status === 'CONFIRMED' ? 'badge-confirmed' : 'badge-pending'}`}>
                                                    {tx.status === 'CONFIRMED' ? '✅' : '❌'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
