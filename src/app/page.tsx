'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regFamily, setRegFamily] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName,
          email: regEmail,
          password: regPassword,
          familyName: regFamily,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Erro ao registrar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card animate-slide">
        <div className="auth-logo">
          <div className="auth-logo-icon">💰</div>
          <h1>FinFamily</h1>
          <p>Gestão Financeira Familiar Inteligente</p>
        </div>

        {error && (
          <div style={{
            background: 'var(--danger-bg)',
            color: 'var(--danger)',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.85rem',
            marginBottom: '1rem',
          }}>
            {error}
          </div>
        )}

        {isLogin ? (
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                className="form-input"
                type="email"
                placeholder="seu@email.com"
                value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Senha</label>
              <input
                className="form-input"
                type="password"
                placeholder="••••••••"
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                required
              />
            </div>
            <button className="btn btn-primary w-full" type="submit" disabled={loading}>
              {loading ? '⏳ Entrando...' : '🚀 Entrar'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label className="form-label">Seu Nome</label>
              <input
                className="form-input"
                type="text"
                placeholder="João Silva"
                value={regName}
                onChange={e => setRegName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Nome da Família</label>
              <input
                className="form-input"
                type="text"
                placeholder="Família Silva"
                value={regFamily}
                onChange={e => setRegFamily(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                className="form-input"
                type="email"
                placeholder="seu@email.com"
                value={regEmail}
                onChange={e => setRegEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Senha</label>
              <input
                className="form-input"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={regPassword}
                onChange={e => setRegPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <button className="btn btn-primary w-full" type="submit" disabled={loading}>
              {loading ? '⏳ Criando...' : '🏠 Criar Família'}
            </button>
          </form>
        )}

        <div className="auth-footer">
          {isLogin ? (
            <p>Não tem conta? <a href="#" onClick={() => { setIsLogin(false); setError(''); }}>Criar família</a></p>
          ) : (
            <p>Já tem conta? <a href="#" onClick={() => { setIsLogin(true); setError(''); }}>Fazer login</a></p>
          )}
        </div>
      </div>
    </div>
  );
}
