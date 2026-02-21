'use client';
import { useState, useEffect } from 'react';

interface Insight {
    id: string;
    type: 'warning' | 'success' | 'info' | 'danger';
    icon: string;
    title: string;
    message: string;
    percentage?: number;
    value?: number;
}

export default function CFOPage() {
    const [insights, setInsights] = useState<Insight[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/cfo').then(r => r.json()).then(data => {
            setInsights(Array.isArray(data) ? data : []);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div>
                <div className="page-header"><h1>🤖 CFO da Família</h1></div>
                <div className="insights-grid">
                    {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 120, borderRadius: 'var(--radius-lg)' }} />)}
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fade">
            <div className="page-header">
                <h1>🤖 CFO da Família</h1>
            </div>

            <div className="card" style={{ marginBottom: '2rem', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.05))' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ fontSize: '3rem' }}>🧠</div>
                    <div>
                        <h3>Inteligência Financeira</h3>
                        <p className="text-sm text-muted">
                            O CFO analisa seus dados e gera insights automáticos. No futuro, este módulo será potencializado por IA avançada.
                        </p>
                    </div>
                </div>
            </div>

            {insights.length === 0 ? (
                <div className="empty-state card">
                    <div className="empty-state-icon">📊</div>
                    <h3>Sem insights no momento</h3>
                    <p>Registre mais transações para receber análises automáticas do seu CFO.</p>
                </div>
            ) : (
                <div className="insights-grid">
                    {insights.map(insight => (
                        <div key={insight.id} className={`insight-card ${insight.type}`}>
                            <div className="insight-icon">{insight.icon}</div>
                            <div className="insight-content">
                                <h4>{insight.title}</h4>
                                <p>{insight.message}</p>
                                {insight.percentage !== undefined && (
                                    <div className="progress-bar mt-1" style={{ maxWidth: 200 }}>
                                        <div className="progress-fill" style={{ width: `${Math.min(Math.abs(insight.percentage), 100)}%` }} />
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="card mt-3" style={{ opacity: 0.6 }}>
                <h3 style={{ marginBottom: '0.5rem' }}>🔮 Evolução Futura</h3>
                <p className="text-sm text-muted">
                    Este módulo está preparado para integrar com APIs de IA (OpenAI, Gemini, etc.) para análises mais profundas, previsões financeiras e recomendações personalizadas.
                </p>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
                    <span className="badge badge-pending">🔌 LLM Plug-and-Play</span>
                    <span className="badge badge-pending">📊 Previsões ML</span>
                    <span className="badge badge-pending">💡 Conselhos Personalizados</span>
                </div>
            </div>
        </div>
    );
}
