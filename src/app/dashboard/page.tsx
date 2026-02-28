'use client';
import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { formatCurrency } from '@/lib/format';
import { useDashboard, DashboardData } from '@/lib/useDashboard';
import { StatCard, LoadingSkeleton, EmptyState, ErrorState } from '@/components/ui';

interface Insight {
  id: string;
  type: 'warning' | 'success' | 'info' | 'danger';
  icon: string;
  title: string;
  message: string;
}

export default function DashboardPage() {
  const { data, error, isLoading, refetch } = useDashboard();
  const [insights, setInsights] = useState<Insight[]>([]);

  useEffect(() => {
    fetch('/api/cfo')
      .then(r => r.json())
      .then(data => setInsights(Array.isArray(data) ? data : []))
      .catch(() => setInsights([]));
  }, []);

  if (isLoading) {
    return (
      <div>
        <div className="page-header"><h1>Dashboard</h1></div>
        <div className="stats-grid">
          {[1, 2, 3, 4].map(i => (
            <LoadingSkeleton key={i} height={120} />
          ))}
        </div>
      </div>
    );
  }

  console.log('Dashboard state - error:', error, 'data:', !!data);

  if (error) {
    return (
      <div className="animate-fade">
        <div className="page-header">
          <h1>📊 Dashboard</h1>
        </div>
        <ErrorState 
          title="Erro ao carregar"
          message={error} 
          onRetry={refetch} 
        />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="animate-fade">
        <div className="page-header">
          <h1>📊 Dashboard</h1>
        </div>
        <EmptyState 
          icon="🔐"
          title="Faça login para continuar"
          message="Você precisa estar logado para ver o dashboard."
        />
      </div>
    );
  }

  return (
    <DashboardContent data={data} insights={insights} />
  );
}

function DashboardContent({ data, insights }: { data: DashboardData; insights: Insight[] }) {
  const fmt = formatCurrency;
  
  return (
    <div className="animate-fade">
      <div className="page-header">
        <h1>📊 Dashboard</h1>
        <span className="text-sm text-muted">
          {new Date().toLocaleDateString('pt-BR', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </span>
      </div>

      <div className="stats-grid">
        <StatCard
          icon="💰"
          label="Saldo do Mês"
          value={fmt(data.balance)}
          variant={data.balance >= 0 ? 'positive' : 'negative'}
          subtitle={`${data.transactionCount} transações este mês`}
        />
        <StatCard
          icon="📈"
          label="Receitas"
          value={fmt(data.income)}
          variant="positive"
        />
        <StatCard
          icon="📉"
          label="Despesas"
          value={fmt(data.expenses)}
          variant="negative"
          badge={(data.currentMonthInstallments ?? 0) > 0 ? (
            <span className="text-muted">📊 {fmt(data.currentMonthInstallments)} em parcelas</span>
          ) : undefined}
        />
        <StatCard
          icon="🎯"
          label="Projeção Fim do Mês"
          value={fmt(data.projectedBalance)}
          variant={data.projectedBalance >= 0 ? 'positive' : 'negative'}
          badge={data.pendingCount > 0 ? (
            <span className="text-warning">⚠️ {data.pendingCount} pendente(s)</span>
          ) : undefined}
        />
      </div>

      {(data.futureInstallments?.length ?? 0) > 0 && (
        <div className="card" style={{ marginTop: '1rem', padding: '1rem' }}>
          <h3 style={{ marginBottom: '0.75rem' }}>📊 Parcelas Futuras</h3>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {data.futureInstallments?.map((f, i) => (
              <div 
                key={i}
                style={{ 
                  padding: '0.5rem 1rem', 
                  background: 'var(--bg-secondary)', 
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)'
                }}
              >
                <div className="text-sm text-muted">{f.month}</div>
                <div style={{ fontWeight: 700, color: 'var(--danger)' }}>{fmt(f.amount)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="charts-grid">
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
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {data.categoryBreakdown.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: unknown) => [fmt(v as number), '']} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState 
              icon="📊" 
              title="Nenhuma despesa" 
              message="Registre suas primeiras transações!" 
            />
          )}
        </div>

        <div className="chart-card">
          <h3>📊 Receitas vs Despesas (6 meses)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={12} />
              <YAxis stroke="var(--text-muted)" fontSize={12} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: unknown) => [fmt(v as number), '']} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }} />
              <Legend />
              <Bar dataKey="income" name="Receitas" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" name="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card" style={{ gridColumn: '1 / -1' }}>
          <h3>📈 Projeção de Saldo</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data.monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={12} />
              <YAxis stroke="var(--text-muted)" fontSize={12} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: unknown) => [fmt(v as number), '']} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }} />
              <Line type="monotone" dataKey="balance" name="Saldo" stroke="#6366f1" strokeWidth={3} dot={{ fill: '#6366f1', r: 5 }} />
              <Line type="monotone" dataKey="income" name="Receitas" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" />
              <Line type="monotone" dataKey="expenses" name="Despesas" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

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

      <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <a href="/dashboard/transactions?add=1" className="btn btn-primary">
          ➕ Adicionar
        </a>
        <a href="/dashboard/chat" className="btn btn-secondary">
          💬 Perguntar ao Chat
        </a>
        <a href="/dashboard/cfo" className="btn btn-secondary">
          🤖 Ver CFO Completo
        </a>
      </div>
    </div>
  );
}
