"use client"

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, X, Smartphone, AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface PendingTransaction {
  id: number;
  description: string;
  amount: number;
  tipo: string;
  estabelecimento: string;
  data: string;
}

export function NotificationReview() {
  const [transactions, setTransactions] = useState<PendingTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingTransactions();
  }, []);

  const fetchPendingTransactions = async () => {
    try {
      setLoading(true);
      // Busca transações com status PENDING
      const response = await fetch('/api/transactions?status=PENDING');
      if (!response.ok) throw new Error('Falha ao carregar transações pendentes');
      const data = await response.json();
      setTransactions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: number, action: 'CONFIRM' | 'REJECT') => {
    try {
      const response = await fetch(`/api/transactions/${id}`, {
        method: action === 'CONFIRM' ? 'PATCH' : 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: action === 'CONFIRM' ? JSON.stringify({ status: 'CONFIRMED' }) : undefined
      });

      if (!response.ok) throw new Error('Falha na operação');

      // Remove da lista local
      setTransactions(prev => prev.filter(t => t.id !== id));
    } catch {
      alert('Erro ao processar transação');
    }
  };

  if (loading) return null; // Silencioso se estiver carregando
  if (transactions.length === 0) return null; // Não mostra nada se não houver pendentes

  return (
    <Card className="rounded-[24px] border-none shadow-[0_15px_40px_rgba(0,0,0,0.06)] bg-white overflow-hidden">
      <CardHeader className="pb-4 bg-primary/5">
        <div className="flex items-center gap-3">
          <div className="bg-primary text-white p-2.5 rounded-2xl shadow-lg shadow-primary/20">
            <Smartphone className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold text-slate-900 leading-tight">
              {transactions.length === 1 ? 'Uma Transação' : `${transactions.length} Transações`} para Revisar
            </CardTitle>
            <CardDescription className="text-slate-500 font-medium">
              Capturamos algumas notificações. Elas só entram no seu saldo após você confirmar.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-6">
        {error && (
          <div className="flex items-center gap-2 text-sm font-semibold text-red-600 bg-red-50 p-3 rounded-2xl">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}
        
        <div className="space-y-3">
            {transactions.map((tx) => (
            <div 
                key={tx.id} 
                className="group flex flex-col md:flex-row md:items-center justify-between p-4 bg-slate-50/50 hover:bg-slate-50 border border-transparent hover:border-slate-100 rounded-[20px] transition-all"
            >
                <div className="flex flex-col gap-1 mb-3 md:mb-0">
                    <p className="font-bold text-slate-900">{tx.description}</p>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                        <span>{tx.tipo}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300" />
                        <span>{new Date(tx.data).toLocaleDateString('pt-BR')}</span>
                    </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-6">
                    <p className="text-xl font-extrabold text-slate-900">
                        {formatCurrency(tx.amount)}
                    </p>
                    <div className="flex gap-2">
                        <Button 
                            size="sm" 
                            className="rounded-full h-10 w-10 p-0 bg-white border border-slate-100 text-green-600 hover:bg-green-50 hover:text-green-700 shadow-sm transition-all"
                            onClick={() => handleAction(tx.id, 'CONFIRM')}
                        >
                            <Check className="h-5 w-5" />
                        </Button>
                        <Button 
                            size="sm" 
                            className="rounded-full h-10 w-10 p-0 bg-white border border-slate-100 text-red-500 hover:bg-red-50 hover:text-red-600 shadow-sm transition-all"
                            onClick={() => handleAction(tx.id, 'REJECT')}
                        >
                            <X className="h-5 w-5" />
                        </Button>
                    </div>
                </div>
            </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}
