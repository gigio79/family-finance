/**
 * Componente para revisar e confirmar transações capturadas de notificações
 * Filtra transações com status PENDING e source NOTIFICATION
 */

import { useState, useEffect } from 'react';

interface PendingTransaction {
  id: string;
  description: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  account: { name: string };
  status: string;
  source: string;
  createdAt: string;
}

export function NotificationTransactionsReview() {
  const [transactions, setTransactions] = useState<PendingTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingTransactions();
  }, []);

  const fetchPendingTransactions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/transactions?status=PENDING&source=NOTIFICATION');
      if (!response.ok) throw new Error('Erro ao carregar transações');
      const data = await response.json();
      setTransactions(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const confirmTransaction = async (id: string) => {
    try {
      const response = await fetch(`/api/transactions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CONFIRMED' })
      });
      if (!response.ok) throw new Error('Erro ao confirmar');
      setTransactions(t => t.filter(x => x.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao confirmar');
    }
  };

  const rejectTransaction = async (id: string) => {
    try {
      const response = await fetch(`/api/transactions/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Erro ao deletar');
      setTransactions(t => t.filter(x => x.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar');
    }
  };

  if (loading) return <div className="p-4">Carregando...</div>;

  if (transactions.length === 0) {
    return (
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
        <p className="text-green-700">✅ Nenhuma transação pendente para revisar</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
        <h3 className="font-semibold text-yellow-900">
          📱 {transactions.length} Transações de Notificações Pendentes
        </h3>
        <p className="text-sm text-yellow-800 mt-1">
          Revise e confirme as transações capturadas automaticamente
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 p-3 rounded-lg text-red-700">
          ⚠️ {error}
        </div>
      )}

      <div className="space-y-3">
        {transactions.map((tx) => (
          <div
            key={tx.id}
            className="bg-white border-l-4 border-blue-500 p-4 rounded-lg flex justify-between items-center"
          >
            <div className="flex-1">
              <p className="font-medium text-gray-900">{tx.description}</p>
              <p className="text-sm text-gray-600">
                {tx.account.name} • {new Date(tx.createdAt).toLocaleDateString('pt-BR')}
              </p>
            </div>

            <div className="text-right mr-4">
              <p className={`text-lg font-semibold ${tx.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                {tx.type === 'INCOME' ? '+' : '-'}R${tx.amount.toFixed(2)}
              </p>
              <span className="inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded mt-1">
                PENDENTE
              </span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => confirmTransaction(tx.id)}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
              >
                ✓ Confirmar
              </button>
              <button
                onClick={() => rejectTransaction(tx.id)}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
              >
                ✗ Rejeitar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
