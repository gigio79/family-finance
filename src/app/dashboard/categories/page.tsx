'use client';
import { useEffect, useState } from 'react';

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  rules: string;
  type: 'INCOME' | 'EXPENSE';
}

type CategoryForm = {
  name: string;
  icon: string;
  color: string;
  type: 'INCOME' | 'EXPENSE';
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState<CategoryForm>({
    name: '',
    icon: '📦',
    color: '#6366f1',
    type: 'EXPENSE'
  });

  const loadCategories = () => {
    fetch('/api/categories')
      .then(r => r.json())
      .then(data => {
        setCategories(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editing ? 'PUT' : 'POST';
    const body = editing ? { id: editing.id, ...form } : form;

    try {
      const res = await fetch('/api/categories', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        try {
          const error = await res.json();
          alert(error?.error || 'Erro ao salvar categoria.');
        } catch {
          alert('Erro ao salvar categoria.');
        }
        return;
      }
    } catch (err) {
      alert('Falha de conexão ao falar com o servidor ao salvar a categoria.');
      console.error('Erro de rede ao salvar categoria:', err);
      return;
    }

    setShowModal(false);
    setEditing(null);
    setForm({ name: '', icon: '📦', color: '#6366f1', type: 'EXPENSE' });
    loadCategories();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remover esta categoria?')) return;
    const res = await fetch(`/api/categories?id=${id}`, { method: 'DELETE' });
    if (!res.ok) {
      try {
        const error = await res.json();
        alert(error?.error || 'Erro ao remover categoria.');
      } catch {
        alert('Erro ao remover categoria.');
      }
      return;
    }
    loadCategories();
  };

  const ICONS = ['🍔', '🚗', '🏠', '💊', '📚', '🎮', '👕', '💰', '📦', '🎁', '✈️', '🐾', '💄', '🔧', '📱', '☕'];

  return (
    <div className="animate-fade">
      <div className="page-header">
        <h1>🏷️ Categorias</h1>
        <button
          className="btn btn-primary"
          onClick={() => {
            setEditing(null);
            setForm({ name: '', icon: '📦', color: '#6366f1', type: 'EXPENSE' });
            setShowModal(true);
          }}
        >
          ➕ Nova Categoria
        </button>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          🏷️ <strong>Categorias ajudam a organizar seus gastos e receitas</strong> para relatórios mais claros. Classifique cada transação para entender melhor para onde vai seu dinheiro.
        </p>
      </div>

      {loading ? (
        <div className="medals-grid">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="skeleton" style={{ height: 100 }} />
          ))}
        </div>
      ) : (
        <div className="medals-grid">
          {categories.map(cat => (
            <div
              key={cat.id}
              className="medal-card earned"
              style={{ borderColor: cat.color + '40' }}
            >
              <div
                className="medal-icon"
                style={{
                  background: `${cat.color}15`,
                  borderRadius: '50%',
                  width: 64,
                  height: 64,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 0.5rem'
                }}
              >
                {cat.icon}
              </div>
              <div className="medal-name">
                {cat.name}{' '}
                <span className="text-sm text-muted">
                  {cat.type === 'INCOME' ? '· Receita' : '· Despesa'}
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  gap: '0.25rem',
                  justifyContent: 'center',
                  marginTop: '0.75rem'
                }}
              >
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => {
                    setEditing(cat);
                    setForm({
                      name: cat.name,
                      icon: cat.icon,
                      color: cat.color,
                      type: cat.type
                    });
                    setShowModal(true);
                  }}
                >
                  ✏️
                </button>
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => handleDelete(cat.id)}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editing ? '✏️ Editar Categoria' : '➕ Nova Categoria'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Nome</label>
                <input
                  className="form-input"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  required
                  placeholder="Ex: Alimentação"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Tipo</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <div
                    className={`filter-chip ${
                      form.type === 'EXPENSE' ? 'active' : ''
                    }`}
                    style={{ flex: 1, textAlign: 'center' }}
                    onClick={() => setForm({ ...form, type: 'EXPENSE' })}
                  >
                    📉 Despesa
                  </div>
                  <div
                    className={`filter-chip ${
                      form.type === 'INCOME' ? 'active' : ''
                    }`}
                    style={{ flex: 1, textAlign: 'center' }}
                    onClick={() => setForm({ ...form, type: 'INCOME' })}
                  >
                    📈 Receita
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Ícone</label>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.5rem'
                  }}
                >
                  {ICONS.map(icon => (
                    <div
                      key={icon}
                      onClick={() => setForm({ ...form, icon })}
                      style={{
                        width: 40,
                        height: 40,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 8,
                        cursor: 'pointer',
                        fontSize: '1.25rem',
                        background:
                          form.icon === icon
                            ? 'var(--accent-primary)'
                            : 'var(--bg-input)',
                        border:
                          form.icon === icon
                            ? '2px solid var(--accent-primary)'
                            : '1px solid var(--border)'
                      }}
                    >
                      {icon}
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Cor</label>
                <input
                  type="color"
                  value={form.color}
                  onChange={e =>
                    setForm({ ...form, color: e.target.value })
                  }
                  style={{
                    width: '100%',
                    height: 40,
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer'
                  }}
                />
              </div>

              <button className="btn btn-primary w-full" type="submit">
                {editing ? '💾 Salvar' : '✅ Criar'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

