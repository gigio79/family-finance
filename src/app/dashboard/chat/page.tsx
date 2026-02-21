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
    const [loading, setLoading] = useState(false);
    const messagesEnd = useRef<HTMLDivElement>(null);

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

    const sendMessage = async () => {
        if (!input.trim() || loading) return;
        const userMsg = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setLoading(true);

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: userMsg }),
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

            <div className="chat-container">
                <div className="chat-messages">
                    {messages.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '2rem' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🤖</div>
                            <h3 style={{ marginBottom: '0.5rem' }}>Assistente Financeiro</h3>
                            <p className="text-muted text-sm" style={{ marginBottom: '1.5rem' }}>
                                Pergunte sobre seus gastos, saldo, ou peça um resumo!
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
                            <span style={{ animation: 'pulse 1s infinite' }}>⏳ Pensando...</span>
                        </div>
                    )}
                    <div ref={messagesEnd} />
                </div>

                <div className="chat-input-area">
                    <input
                        className="chat-input"
                        placeholder="Pergunte algo... ex: Quanto gastamos este mês?"
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
