'use client';
import { useState, useEffect } from 'react';

interface Medal {
    type: string;
    name: string;
    icon: string;
    description: string;
    earned: boolean;
    earnedAt: string | null;
}

interface RankingUser {
    id: string;
    name: string;
    points: number;
    streak: number;
    achievements: { type: string }[];
}

export default function GamificationPage() {
    const [medals, setMedals] = useState<Medal[]>([]);
    const [ranking, setRanking] = useState<RankingUser[]>([]);
    const [userPoints, setUserPoints] = useState(0);
    const [userStreak, setUserStreak] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/gamification').then(r => r.json()).then(data => {
            setMedals(data.medals || []);
            setRanking(data.ranking || []);
            setUserPoints(data.userPoints || 0);
            setUserStreak(data.userStreak || 0);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div>
                <div className="page-header"><h1>🏆 Gamificação</h1></div>
                <div className="stats-grid">{[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 80 }} />)}</div>
            </div>
        );
    }

    const nextLevel = Math.ceil((userPoints + 1) / 100) * 100;
    const progress = (userPoints % 100);

    return (
        <div className="animate-fade">
            <div className="page-header">
                <h1>🏆 Gamificação</h1>
            </div>

            <div className="card" style={{ marginBottom: '1.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    🏆 <strong>Acompanhe sua evolução financeira</strong> através de metas, desafios e conquistas. Complete objetivos para melhorar o controle e disciplina da família.
                </p>
            </div>

            {/* User stats */}
            <div className="stats-grid">
                <div className="stat-card balance">
                    <span className="stat-icon">⭐</span>
                    <div className="stat-label">Seus Pontos</div>
                    <div className="stat-value" style={{ color: 'var(--accent-primary)' }}>{userPoints}</div>
                    <div className="progress-bar mt-1">
                        <div className="progress-fill" style={{ width: `${progress}%` }} />
                    </div>
                    <div className="text-xs text-muted mt-1">{progress} / 100 para próximo nível</div>
                </div>
                <div className="stat-card income">
                    <span className="stat-icon">🔥</span>
                    <div className="stat-label">Sequência</div>
                    <div className="stat-value positive">{userStreak} dias</div>
                </div>
                <div className="stat-card goal">
                    <span className="stat-icon">🏅</span>
                    <div className="stat-label">Medalhas</div>
                    <div className="stat-value" style={{ color: 'var(--warning)' }}>
                        {medals.filter(m => m.earned).length} / {medals.length}
                    </div>
                </div>
            </div>

            {/* Medals */}
            <h2 style={{ marginBottom: '1rem' }}>🏅 Medalhas</h2>
            <div className="medals-grid" style={{ marginBottom: '2rem' }}>
                {medals.map(medal => (
                    <div key={medal.type} className={`medal-card ${medal.earned ? 'earned' : 'locked'}`}>
                        <div className="medal-icon">{medal.icon}</div>
                        <div className="medal-name">{medal.name}</div>
                        <div className="medal-desc">{medal.description}</div>
                        {medal.earned && medal.earnedAt && (
                            <div className="text-xs text-muted mt-1">
                                ✅ {new Date(medal.earnedAt).toLocaleDateString('pt-BR')}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* How to earn */}
            <div className="card" style={{ marginBottom: '2rem' }}>
                <h3 style={{ marginBottom: '1rem' }}>📖 Como Ganhar Pontos</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem' }}>
                    {[
                        { action: 'Registrar gasto/receita', points: '+10', icon: '💳' },
                        { action: 'Cumprir meta mensal', points: '+20', icon: '🎯' },
                        { action: 'Login diário', points: '+5', icon: '📅' },
                        { action: 'Categorizar gasto', points: '+5', icon: '🏷️' },
                        { action: 'Manter orçamento', points: '+15', icon: '📊' },
                    ].map((item, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-secondary)' }}>
                            <span style={{ fontSize: '1.5rem' }}>{item.icon}</span>
                            <div>
                                <div className="text-sm font-bold">{item.action}</div>
                                <div className="text-xs text-success">{item.points} pts</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Family Ranking */}
            <h2 style={{ marginBottom: '1rem' }}>👨‍👩‍👧‍👦 Ranking Familiar</h2>
            <div className="ranking-list">
                {ranking.map((user, i) => (
                    <div key={user.id} className="ranking-item">
                        <div className="ranking-position" style={{
                            background: i === 0 ? 'linear-gradient(135deg, #f59e0b, #eab308)' :
                                i === 1 ? 'linear-gradient(135deg, #94a3b8, #cbd5e1)' :
                                    i === 2 ? 'linear-gradient(135deg, #b45309, #d97706)' : 'var(--accent-gradient)',
                        }}>
                            {i + 1}
                        </div>
                        <div className="ranking-name">
                            {user.name}
                            {i === 0 && ' 👑'}
                        </div>
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                            {user.achievements?.map((a, j) => (
                                <span key={j} title={a.type}>🏅</span>
                            ))}
                        </div>
                        <div className="ranking-points">{user.points} pts</div>
                        <div className="text-sm text-muted">🔥 {user.streak}d</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
