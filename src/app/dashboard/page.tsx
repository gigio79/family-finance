'use client';
import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';

interface DashboardData {
    income: number;
    expenses: number;
    balance: number;
    categoryBreakdown: { name: string; total: number; color: string; icon: string }[];
    monthlyTrend: { month: string; income: number; expenses: number; balance: number }[];
    projectedBalance: number;
    pendingCount: number;
    transactionCount: number;
}

interface Insight {
    id: string;
    type: 'warning' | 'success' | 'info' | 'danger';
    icon: string;
    title: string;
    message: string;
}

export default function DashboardPage() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [insights, setInsights] = useState<Insight[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            fetch('/api/dashboard').then(r => r.json()),
            fetch('/api/cfo').then(r => r.json()),
        ]).then(([dashData, cfoData]) => {
            setData(dashData);
            setInsights(Array.isArray(cfoData) ? cfoData : []);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    const fmt = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    if (loading) {
        return (
            <div>
                <div className="page-header"><h1>Dashboard</h1></div>
                <div className="stats-grid">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="skeleton" style={{ height: 120, borderRadius: 'var(--radius-lg)' }} />
                    ))}
                </div>
            </div>
        );
    }

    if (!data) return <div className="empty-state"><div className="empty-state-icon">📊</div><h3>Erro ao carregar</h3></div>;

    return (
        <div className="animate-fade">
            <div className="page-header">
                <h1>📊 Dashboard</h1>
                <span className="text-sm text-muted">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="stat-card balance">
                    <span className="stat-icon">💰</span>
                    <div className="stat-label">Saldo do Mês</div>
                    <div className={`stat-value ${data.balance >= 0 ? 'positive' : 'negative'}`}>
                        {fmt(data.balance)}
                    </div>
                    <div className="stat-change text-muted">{data.transactionCount} transações este mês</div>
                </div>
                <div className="stat-card income">
                    <span className="stat-icon">📈</span>
                    <div className="stat-label">Receitas</div>
                    <div className="stat-value positive">{fmt(data.income)}</div>
                </div>
                <div className="stat-card expense">
                    <span className="stat-icon">📉</span>
                    <div className="stat-label">Despesas</div>
                    <div className="stat-value negative">{fmt(data.expenses)}</div>
                </div>
                <div className="stat-card goal">
                    <span className="stat-icon">🎯</span>
                    <div className="stat-label">Projeção Fim do Mês</div>
                    <div className={`stat-value ${data.projectedBalance >= 0 ? 'positive' : 'negative'}`}>
                        {fmt(data.projectedBalance)}
                    </div>
                    {data.pendingCount > 0 && (
                        <div className="stat-change text-warning">⚠️ {data.pendingCount} pendente(s)</div>
                    )}
                </div>
            </div>

            {/* Charts */}
            <div className="charts-grid">
                {/* Pie Chart - Categories */}
                <div className="chart-card">
                    <h3>🏷️ Despesas por Categoria</h3>
                    {data.categoryBreakdown.length > 0 ? (
                        <ResponsiveContainer width="100%" height={280}>
                            <PieChart>
                                <Pie
                                    data={data.categoryBreakdown}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={100}
                                    innerRadius={50}
                                    dataKey="total"
                                    nameKey="name"
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    labelLine={false}
                                >
                                    {data.categoryBreakdown.map((entry, i) => (
                                        <Cell key={i} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(v: number) => fmt(v)} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="empty-state"><p>Nenhuma despesa registrada</p></div>
                    )}
                </div>

                {/* Bar Chart - Income vs Expenses */}
                <div className="chart-card">
                    <h3>📊 Receitas vs Despesas (6 meses)</h3>
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={data.monthlyTrend}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                            <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={12} />
                            <YAxis stroke="var(--text-muted)" fontSize={12} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                            <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }} />
                            <Legend />
                            <Bar dataKey="income" name="Receitas" fill="#10b981" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="expenses" name="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Line Chart - Balance Trend */}
                <div className="chart-card" style={{ gridColumn: '1 / -1' }}>
                    <h3>📈 Projeção de Saldo</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={data.monthlyTrend}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                            <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={12} />
                            <YAxis stroke="var(--text-muted)" fontSize={12} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                            <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }} />
                            <Line type="monotone" dataKey="balance" name="Saldo" stroke="#6366f1" strokeWidth={3} dot={{ fill: '#6366f1', r: 5 }} />
                            <Line type="monotone" dataKey="income" name="Receitas" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" />
                            <Line type="monotone" dataKey="expenses" name="Despesas" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* CFO Insights */}
            {insights.length > 0 && (
                <div style={{ marginTop: '1.5rem' }}>
                    <h2 style={{ marginBottom: '1rem' }}>🤖 Insights do CFO</h2>
                    <div className="insights-grid">
                        {insights.map(insight => (
                            <div key={insight.id} className={`insight-card ${insight.type}`}>
                                <div className="insight-icon">{insight.icon}</div>
                                <div className="insight-content">
                                    <h4>{insight.title}</h4>
                                    <p>{insight.message}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Quick actions */}
            <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <a href="/dashboard/transactions" className="btn btn-primary" onClick={(e) => { e.preventDefault(); window.location.href = '/dashboard/transactions'; }}>
                    ➕ Nova Transação
                </a>
                <a href="/dashboard/chat" className="btn btn-secondary" onClick={(e) => { e.preventDefault(); window.location.href = '/dashboard/chat'; }}>
                    💬 Perguntar ao Chat
                </a>
                <a href="/dashboard/cfo" className="btn btn-secondary" onClick={(e) => { e.preventDefault(); window.location.href = '/dashboard/cfo'; }}>
                    🤖 Ver CFO Completo
                </a>
            </div>
        </div>
    );
}
