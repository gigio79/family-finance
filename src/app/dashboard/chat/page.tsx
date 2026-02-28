'use client';
import { useState, useEffect, useRef } from 'react';

interface ChatMsg {
    id: string;
    content: string;
    response: string;
    createdAt: string;
}

export default function ChatPage() {
    const [messages, setMessages] = useState<{ role: 'user' | 'bot'; text: string }[]>([]);
    const [input, setInput] = useState('');
    const [file, setFile] = useState<{ base64: string, type: string, name: string } | null>(null);
    const [loading, setLoading] = useState(false);
    const messagesEnd = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Load history
        fetch('/api/chat').then(r => r.json()).then((data: ChatMsg[]) => {
            if (Array.isArray(data)) {
                const history: { role: 'user' | 'bot'; text: string }[] = [];
                data.forEach(m => {
                    history.push({ role: 'user', text: m.content });
                    history.push({ role: 'bot', text: m.response });
                });
                setMessages(history);
            }
        });
    }, []);

    useEffect(() => {
        messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = (reader.result as string).split(',')[1];
                setFile({ base64, type: selectedFile.type, name: selectedFile.name });
            };
            reader.readAsDataURL(selectedFile);
        }
    };

    const sendMessage = async () => {
        if ((!input.trim() && !file) || loading) return;
        const userMsg = input.trim();
        const currentFile = file;

        setInput('');
        setFile(null);
        setMessages(prev => [...prev, { role: 'user', text: userMsg || (currentFile ? `📷 Enviou: ${currentFile.name}` : '') }]);
        setLoading(true);

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: userMsg,
                    file: currentFile ? { base64: currentFile.base64, type: currentFile.type } : undefined
                }),
            });
            const data = await res.json();
            setMessages(prev => [...prev, { role: 'bot', text: data.response || 'Desculpe, ocorreu um erro.' }]);
        } catch {
            setMessages(prev => [...prev, { role: 'bot', text: '❌ Erro ao processar. Tente novamente.' }]);
        }
        setLoading(false);
    };

    const suggestions = [
        'Saldo atual',
        'Quanto gastamos com alimentação?',
        'Qual a maior despesa?',
        'Resumo do mês',
    ];

    return (
        <div className="animate-fade">
            <div className="page-header">
                <h1>💬 Chat Financeiro</h1>
            </div>

            <div className="card" style={{ marginBottom: '1.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    💬 <strong>Converse com a IA</strong> para entender melhor seus hábitos financeiros e tomar decisões mais estratégicas. Envie fotos de notas fiscais para registrar automaticamente.
                </p>
            </div>

            <div className="chat-container">
                <div className="chat-messages">
                    {messages.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '2rem' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🤖</div>
                            <h3 style={{ marginBottom: '0.5rem' }}>Assistente Financeiro</h3>
                            <p className="text-muted text-sm" style={{ marginBottom: '1.5rem' }}>
                                Pergunte sobre seus gastos, mande uma foto da nota fiscal ou peça um resumo!
                            </p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' }}>
                                {suggestions.map((s, i) => (
                                    <button key={i} className="filter-chip" onClick={() => { setInput(s); }}>
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    {messages.map((m, i) => (
                        <div key={i} className={`chat-bubble ${m.role === 'user' ? 'user' : 'bot'}`}>
                            {m.text.split('\n').map((line, j) => (
                                <span key={j}>{line}<br /></span>
                            ))}
                        </div>
                    ))}
                    {loading && (
                        <div className="chat-bubble bot" style={{ opacity: 0.7 }}>
                            <span style={{ animation: 'pulse 1s infinite' }}>⏳ Analisando...</span>
                        </div>
                    )}
                    <div ref={messagesEnd} />
                </div>

                {file && (
                    <div className="file-preview" style={{ padding: '0.5rem 1rem', background: 'var(--bg-main)', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ fontSize: '1.5rem' }}>📄</span>
                        <div style={{ flex: 1 }}>
                            <div className="text-sm font-medium">{file.name}</div>
                            <div className="text-xs text-muted">Pronto para enviar</div>
                        </div>
                        <button className="btn btn-icon" onClick={() => setFile(null)}>✕</button>
                    </div>
                )}

                <div className="chat-input-area">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*,application/pdf"
                        style={{ display: 'none' }}
                    />
                    <button
                        className="btn btn-icon"
                        onClick={() => fileInputRef.current?.click()}
                        style={{ background: 'transparent', fontSize: '1.25rem' }}
                        title="Anexar comprovante"
                    >
                        📎
                    </button>
                    <input
                        className="chat-input"
                        placeholder="Pergunte algo ou envie um comprovante..."
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && sendMessage()}
                        disabled={loading}
                    />
                    <button className="chat-send" onClick={sendMessage} disabled={loading}>
                        ➤
                    </button>
                </div>
            </div>
        </div>
    );
}
