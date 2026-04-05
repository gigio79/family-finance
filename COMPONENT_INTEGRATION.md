# 📋 Integração - Como Usar NotificationTransactionsReview

## Opção 1: Na Página de Transactions

Edite `src/app/dashboard/transactions/page.tsx`:

```tsx
import { NotificationTransactionsReview } from '@/components/NotificationTransactionsReview';

export default function TransactionsPage() {
  return (
    <div className="space-y-6">
      {/* Seção de notificações PENDENTES - coloque no topo */}
      <NotificationTransactionsReview />
      
      {/* Suas seções normais de transactions abaixo */}
      <div>
        <h2>Todas as Transações</h2>
        {/* ... seu código existente ... */}
      </div>
    </div>
  );
}
```

## Opção 2: Na Dashboard Principal

Edite `src/app/dashboard/page.tsx`:

```tsx
'use client';
import { NotificationTransactionsReview } from '@/components/NotificationTransactionsReview';

export default function DashboardPage() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Widget esquerdo - notificações pendentes */}
      <div className="lg:col-span-full">
        <NotificationTransactionsReview />
      </div>
      
      {/* Resto da dashboard */}
      <div>
        {/* Seu conteúdo aqui */}
      </div>
    </div>
  );
}
```

## Opção 3: Como Modal/Card Flutuante

```tsx
'use client';
import { useState } from 'react';
import { NotificationTransactionsReview } from '@/components/NotificationTransactionsReview';

export default function Layout() {
  const [showPending, setShowPending] = useState(true);
  
  return (
    <div>
      {/* Seu layout */}
      
      {showPending && (
        <div className="fixed bottom-4 right-4 w-full max-w-md max-h-96 overflow-auto bg-white shadow-lg rounded-lg p-4 border-l-4 border-yellow-500">
          <button 
            onClick={() => setShowPending(false)}
            className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
          <NotificationTransactionsReview />
        </div>
      )}
    </div>
  );
}
```

## Opção 4: Versão Customizada

Se quiser modificar o componente, edite `src/components/NotificationTransactionsReview.tsx`:

```tsx
// Exemplo: Mudar cores
<div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
  {/* seu conteúdo */}
</div>

// Exemplo: Adicionar mais colunas
<div className="flex justify-between items-center gap-4">
  <div className="flex-1">
    {/* descrição */}
  </div>
  <div className="text-right">
    {/* valor */}
  </div>
  <div>
    {/* categoria (novo!) */}
  </div>
  <div>
    {/* ações */}
  </div>
</div>
```

## Exemplo Completo de Integração

```tsx
// src/app/dashboard/transactions/page.tsx
'use client';

import { NotificationTransactionsReview } from '@/components/NotificationTransactionsReview';
import { useState, useEffect } from 'react';

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  date: string;
  status: string;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Carrega transações confirmadas
    fetch('/api/transactions?status=CONFIRMED')
      .then(res => res.json())
      .then(data => {
        setTransactions(data);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-8">
      {/* ⚠️ ATENÇÃO: Este card deve estar visível para o usuário */}
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
        <NotificationTransactionsReview />
      </div>

      {/* Suas transações confirmadas */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Histórico de Transações</h2>
        
        {loading ? (
          <p>Carregando...</p>
        ) : (
          <div className="space-y-2">
            {transactions.map(tx => (
              <div key={tx.id} className="flex justify-between p-3 border-b">
                <span>{tx.description}</span>
                <span className={tx.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}>
                  {tx.type === 'INCOME' ? '+' : '-'}R${tx.amount.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

## API para Gerenciar Transações

O componente usa esses endpoints:

### GET - Listar transações PENDING de notificações
```
GET /api/transactions?status=PENDING&source=NOTIFICATION
Response: Transaction[]
```

### PATCH - Confirmar transação
```
PATCH /api/transactions/:id
Body: { status: "CONFIRMED" }
```

### DELETE - Rejeitar transação
```
DELETE /api/transactions/:id
```

## Customizações Possíveis

### 1. Mostrar icon de notificação se houver PENDING
```tsx
const [pendingCount, setPendingCount] = useState(0);

useEffect(() => {
  fetch('/api/transactions?status=PENDING&source=NOTIFICATION')
    .then(res => res.json())
    .then(data => setPendingCount(data.length));
}, []);

return (
  <div className="relative">
    <button>
      📬 Transações
      {pendingCount > 0 && (
        <span className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
          {pendingCount}
        </span>
      )}
    </button>
  </div>
);
```

### 2. Auto-confirmar se confiança > 90%
Modifique `src/app/api/webhooks/notifications/route.ts`:

```typescript
// Após confirmar sucesso
if (parsedData.confidence > 0.9) {
  // Atualiza para CONFIRMED automaticamente
  await prisma.transaction.update({
    where: { id: transaction.id },
    data: { status: 'CONFIRMED' }
  });
  return NextResponse.json({
    success: true,
    message: 'Transação confirmada automaticamente (alta confiança)!'
  });
}
```

### 3. Notificação ao usuário quando há pendentes
```tsx
'use client';
import { useEffect } from 'react';

export function NotificationAlert() {
  useEffect(() => {
    // Verifica a cada minuto se há pendentes
    const interval = setInterval(async () => {
      const res = await fetch('/api/transactions?status=PENDING&source=NOTIFICATION');
      const data = await res.json();
      
      if (data.length > 0) {
        // Mostra notificação desktop
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Family Finance', {
            body: `Você tem ${data.length} transações de notificação para revisar!`,
            icon: '/icon-192x192.png'
          });
        }
      }
    }, 60000); // A cada minuto
    
    return () => clearInterval(interval);
  }, []);

  return null; // Componente invisível
}
```

## Estilos Customizados

Se quiser um visual diferente, ajuste as classes Tailwind no componente:

```tsx
// Verde para INCOME, Vermelho para EXPENSE
<div className={`
  border-l-4 p-4 rounded-lg
  ${tx.type === 'INCOME' 
    ? 'bg-green-50 border-green-500' 
    : 'bg-red-50 border-red-500'
  }
`}>
  {/* conteúdo */}
</div>
```

---

**Dica**: Coloque o componente **no topo da página** para que o usuário veja as transações pendentes imediatamente ao entrar na dashboard!
