'use client';
import { useState, useEffect } from 'react';
import { format, addMonths, subMonths, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Account {
    id: string;
    name: string;
    type: string;
    limit: number | null;
    closingDay: number | null;
    dueDay: number | null;
    color: string;
    icon: string;
    usedLimit: number;
    availableLimit: number;
    utilizationPercent: number;
}

interface BillData {
    account: { name: string; dueDay: number };
    billingMonth: string;
    billingMonthLabel: string;
    dueDate: string;
    isOverdue: boolean;
    totalBill: number;
    totalPaid: number;
    totalPending: number;
    transactionCount: number;
    transactions: any[];
}

export default function CreditCardsPage() {
    const [cards, setCards] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showBillModal, setShowBillModal] = useState(false);
    const [selectedCard, setSelectedCard] = useState<Account | null>(null);
    const [billData, setBillData] = useState<BillData | null>(null);
    const [billMonth, setBillMonth] = useState(format(new Date(), 'yyyy-MM'));
    const [form, setForm] = useState({
        name: '', type: 'CREDIT_CARD', limit: '', closingDay: '25', dueDay: '10', color: '#6366f1', icon: '💳'
    });

    const loadCards = () => {
        fetch('/api/accounts').then(r => r.json()).then(data => {
            const creditCards = Array.isArray(data) ? data.filter((a: Account) => a.type === 'CREDIT_CARD') : [];
            setCards(creditCards);
            setLoading(false);
        });
    };

    useEffect(() => { loadCards(); }, []);

    const loadBill = async (cardId: string, month: string) => {
        const res = await fetch(`/api/accounts/${cardId}/bill?month=${month}`);
        const data = await res.json();
        setBillData(data);
    };

    const openBill = async (card: Account) => {
        setSelectedCard(card);
        await loadBill(card.id, billMonth);
        setShowBillModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await fetch('/api/accounts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...form, type: 'CREDIT_CARD' })
        });
        setShowModal(false);
        setForm({ name: '', type: 'CREDIT_CARD', limit: '', closingDay: '25', dueDay: '10', color: '#6366f1', icon: '💳' });
        loadCards();
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Remover este cartão?')) return;
        await fetch(`/api/accounts?id=${id}`, { method: 'DELETE' });
        loadCards();
    };

    const handlePayBill = async () => {
        if (!selectedCard) return;
        if (!confirm('Confirmar pagamento da fatura?')) return;
        
        const res = await fetch(`/api/accounts/${selectedCard.id}/bill`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ month: billMonth })
        });
        
        const data = await res.json();
        alert(data.message);
        loadBill(selectedCard.id, billMonth);
        loadCards();
    };

    const changeBillMonth = async (delta: number) => {
        const current = parseISO(billMonth + '-01');
        const newMonth = delta > 0 ? addMonths(current, 1) : subMonths(current, 1);
        setBillMonth(format(newMonth, 'yyyy-MM'));
        if (selectedCard) {
            await loadBill(selectedCard.id, format(newMonth, 'yyyy-MM'));
        }
    };

    const fmt = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const colors = ['#6366f1', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6'];

    return (
        <div className="animate-fade">
            <div className="page-header">
                <h1>💳 Cartões de Crédito</h1>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    ➕ Novo Cartão
                </button>
            </div>

            <div className="card" style={{ marginBottom: '1.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    💳 <strong>Acompanhe suas faturas mensais</strong> e o limite disponível de cada cartão. Aqui você visualiza todas as compras lançadas na fatura.
                </p>
            </div>

            {loading ? (
                <div className="skeleton" style={{ height: 200, borderRadius: 'var(--radius-lg)' }} />
            ) : cards.length === 0 ? (
                <div className="empty-state card">
                    <div className="empty-state-icon">💳</div>
                    <h3>Nenhum cartão cadastrado</h3>
                    <p>Adicione seu primeiro cartão de crédito!</p>
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>➕ Adicionar</button>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                    {cards.map(card => (
                        <div key={card.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                            <div style={{ 
                                background: card.color, 
                                padding: '1.5rem',
                                color: 'white'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{card.icon}</div>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{card.name}</div>
                                    </div>
                                    <button 
                                        className="btn btn-sm" 
                                        style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}
                                        onClick={() => openBill(card)}
                                    >
                                        📋 Fatura
                                    </button>
                                </div>
                                    <div style={{ marginTop: '1.5rem', fontSize: '0.9rem', opacity: 0.9 }}>
                                        Limite: {fmt(card.limit || 0)}
                                    </div>
                            </div>
                            <div style={{ padding: '1rem' }}>
                                <div style={{ marginBottom: '0.5rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                                        <span className="text-muted">Utilizado</span>
                                        <span>{fmt(card.usedLimit)}</span>
                                    </div>
                                    <div style={{ height: 8, background: 'var(--bg-secondary)', borderRadius: 4, overflow: 'hidden' }}>
                                        <div style={{ 
                                            width: `${Math.min(card.utilizationPercent, 100)}%`, 
                                            height: '100%', 
                                            background: card.utilizationPercent > 80 ? 'var(--danger)' : card.utilizationPercent > 50 ? '#f59e0b' : 'var(--success)',
                                            transition: 'width 0.3s'
                                        }} />
                                    </div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                                    <span className="text-muted">Fechamento: dia {card.closingDay}</span>
                                    <span className="text-muted">Vencimento: dia {card.dueDay}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                                    <span style={{ fontWeight: 600 }}>Disponível</span>
                                    <span style={{ fontWeight: 700, color: 'var(--success)' }}>{fmt(card.availableLimit)}</span>
                                </div>
                                <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(card.id)}>🗑️</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal - Novo Cartão */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>💳 Novo Cartão</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Nome do Cartão</label>
                                <input className="form-input" type="text" placeholder="Ex: Nubank, Itaú..." value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Limite (R$)</label>
                                <input className="form-input" type="number" step="0.01" placeholder="5000,00" value={form.limit} onChange={e => setForm({...form, limit: e.target.value})} required />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Dia Fechamento</label>
                                    <input className="form-input" type="number" min="1" max="31" value={form.closingDay} onChange={e => setForm({...form, closingDay: e.target.value})} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Dia Vencimento</label>
                                    <input className="form-input" type="number" min="1" max="31" value={form.dueDay} onChange={e => setForm({...form, dueDay: e.target.value})} required />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Cor</label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    {colors.map(c => (
                                        <div key={c} onClick={() => setForm({...form, color: c})} style={{
                                            width: 32, height: 32, borderRadius: '50%', background: c, cursor: 'pointer',
                                            border: form.color === c ? '3px solid white' : 'none',
                                            boxShadow: form.color === c ? `0 0 0 2px ${c}` : 'none'
                                        }} />
                                    ))}
                                </div>
                            </div>
                            <button className="btn btn-primary w-full" type="submit">💾 Salvar</button>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal - Fatura */}
            {showBillModal && billData && (
                <div className="modal-overlay" onClick={() => setShowBillModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
                        <div className="modal-header">
                            <h2>📋 Fatura - {billData.account.name}</h2>
                            <button className="modal-close" onClick={() => setShowBillModal(false)}>×</button>
                        </div>
                        
                        <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <button className="btn btn-sm btn-secondary" onClick={() => changeBillMonth(-1)}>◀</button>
                                <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{billData.billingMonthLabel}</span>
                                <button className="btn btn-sm btn-secondary" onClick={() => changeBillMonth(1)}>▶</button>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', textAlign: 'center' }}>
                                <div>
                                    <div className="text-sm text-muted">Total Fatura</div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--danger)' }}>{fmt(billData.totalBill)}</div>
                                </div>
                                <div>
                                    <div className="text-sm text-muted">Vencimento</div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{billData.dueDate}</div>
                                </div>
                            </div>
                            {billData.totalPending > 0 && (
                                <button className="btn btn-primary w-full" style={{ marginTop: '1rem' }} onClick={handlePayBill}>
                                    💳 Pagar Fatura ({fmt(billData.totalPending)})
                                </button>
                            )}
                        </div>

                        <div style={{ maxHeight: 300, overflow: 'auto' }}>
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Data</th>
                                        <th>Descrição</th>
                                        <th>Valor</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {billData.transactions.map(tx => (
                                        <tr key={tx.id}>
                                            <td>{new Date(tx.date).toLocaleDateString('pt-BR')}</td>
                                            <td>{tx.description}</td>
                                            <td style={{ fontWeight: 600, color: 'var(--danger)' }}>{fmt(tx.amount)}</td>
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
