'use client';
import { useState, useEffect } from 'react';

interface FamilyMember {
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string;
}

interface Family {
    id: string;
    name: string;
    users: FamilyMember[];
}

export default function FamilyPage() {
    const [family, setFamily] = useState<Family | null>(null);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [userRole, setUserRole] = useState<string>('MEMBER');
    const [form, setForm] = useState({
        name: '',
        email: '',
        password: '',
        role: 'MEMBER'
    });
    const [message, setMessage] = useState('');

    const loadFamily = () => {
        fetch('/api/family', { credentials: 'include' })
            .then(r => r.json())
            .then(data => {
                setFamily(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    };

    useEffect(() => {
        fetch('/api/auth/session', { credentials: 'include' })
            .then(r => r.json())
            .then(data => {
                if (data.authenticated) {
                    setUserRole(data.user.role);
                }
            });
        loadFamily();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const res = await fetch('/api/family', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(form)
        });

        const data = await res.json();
        
        if (res.ok) {
            setMessage('Membro adicionado com sucesso!');
            setShowModal(false);
            setForm({ name: '', email: '', password: '', role: 'MEMBER' });
            loadFamily();
        } else {
            setMessage(data.error || 'Erro ao adicionar membro');
        }
    };

    const handleDelete = async (userId: string) => {
        if (!confirm('Tem certeza que deseja remover este membro?')) return;

        const res = await fetch(`/api/family?userId=${userId}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        if (res.ok) {
            loadFamily();
        } else {
            const data = await res.json();
            alert(data.error || 'Erro ao remover membro');
        }
    };

    const handleRoleChange = async (userId: string, newRole: string) => {
        const res = await fetch('/api/family', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ userId, role: newRole })
        });

        if (res.ok) {
            loadFamily();
        } else {
            const data = await res.json();
            alert(data.error || 'Erro ao alterar papel');
        }
    };

    if (loading) {
        return <div className="skeleton" style={{ height: 300 }} />;
    }

    return (
        <div className="animate-fade">
            <div className="page-header">
                <h1>👨‍👩‍👧‍👦 Gerenciar Família</h1>
                {userRole === 'ADMIN' && (
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        ➕ Adicionar Membro
                    </button>
                )}
            </div>

            {message && (
                <div className="alert alert-success" style={{ marginBottom: '1rem' }}>
                    {message}
                </div>
            )}

            <div className="card">
                <h3 style={{ marginBottom: '1rem' }}>🏠 {family?.name}</h3>
                <p className="text-muted">{family?.users.length} membro(s) na família</p>
            </div>

            <div style={{ marginTop: '1.5rem' }}>
                <h3 style={{ marginBottom: '1rem' }}>Membros</h3>
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Nome</th>
                                <th>Email</th>
                                <th>Papel</th>
                                <th>Desde</th>
                                {userRole === 'ADMIN' && <th>Ações</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {family?.users.map(member => (
                                <tr key={member.id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <div className="avatar avatar-sm">
                                                {member.name[0].toUpperCase()}
                                            </div>
                                            {member.name}
                                        </div>
                                    </td>
                                    <td>{member.email}</td>
                                    <td>
                                        {userRole === 'ADMIN' && member.role !== 'ADMIN' ? (
                                            <select
                                                className="form-select"
                                                style={{ width: 'auto' }}
                                                value={member.role}
                                                onChange={(e) => handleRoleChange(member.id, e.target.value)}
                                            >
                                                <option value="MEMBER">Membro</option>
                                                <option value="ADMIN">Administrador</option>
                                            </select>
                                        ) : (
                                            <span className={`badge ${member.role === 'ADMIN' ? 'badge-confirmed' : ''}`}>
                                                {member.role === 'ADMIN' ? '👑 Administrador' : '👤 Membro'}
                                            </span>
                                        )}
                                    </td>
                                    <td>{new Date(member.createdAt).toLocaleDateString('pt-BR')}</td>
                                    {userRole === 'ADMIN' && (
                                        <td>
                                            {member.role !== 'ADMIN' && (
                                                <button
                                                    className="btn btn-sm btn-danger"
                                                    onClick={() => handleDelete(member.id)}
                                                >
                                                    🗑️
                                                </button>
                                            )}
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {userRole !== 'ADMIN' && (
                <div className="card" style={{ marginTop: '1.5rem', background: 'var(--bg-secondary)' }}>
                    <p className="text-sm text-muted">
                        💡 Apenas administradores podem adicionar ou remover membros da família.
                    </p>
                </div>
            )}

            {/* Modal - Adicionar Membro */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>➕ Adicionar Membro</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Nome</label>
                                <input
                                    className="form-input"
                                    type="text"
                                    placeholder="Nome completo"
                                    value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Email</label>
                                <input
                                    className="form-input"
                                    type="email"
                                    placeholder="email@exemplo.com"
                                    value={form.email}
                                    onChange={e => setForm({ ...form, email: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Senha</label>
                                <input
                                    className="form-input"
                                    type="password"
                                    placeholder="••••••••"
                                    value={form.password}
                                    onChange={e => setForm({ ...form, password: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Papel</label>
                                <select
                                    className="form-select"
                                    value={form.role}
                                    onChange={e => setForm({ ...form, role: e.target.value })}
                                >
                                    <option value="MEMBER">👤 Membro</option>
                                    <option value="ADMIN">👑 Administrador</option>
                                </select>
                            </div>
                            <button className="btn btn-primary w-full" type="submit">
                                ➕ Adicionar
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
