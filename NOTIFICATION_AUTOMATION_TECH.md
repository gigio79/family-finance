# 🎯 Automação Macrodroid + OpenAI - Resumo Técnico

## Como Funciona

```
Notificação Recebida (PicPay/Mercado Pago)
         ↓
Macrodroid captura o texto
         ↓
POST para /api/webhooks/notifications
         ↓
OpenAI interpreta o texto (parseNotificationWithAI)
         ↓
Extrai: valor, tipo (INCOME/EXPENSE), descrição, conta, categoria
         ↓
Cria Transaction com status PENDING
         ↓
Dashboard mostra como "Pendente" para revisar
         ↓
Usuário clica "Confirmar" ou "Rejeitar"
         ↓
Status muda para CONFIRMED ou é deletada
```

## Arquivos Criados

### 1. **Backend Endpoint**
- `src/app/api/webhooks/notifications/route.ts` 
  - Recebe POST from Macrodroid
  - Valida família e usuário admin
  - Encontra conta pelo nome
  - Cria transaction com status PENDING

### 2. **Parser com IA**
- `src/lib/notification-parser.ts`
  - `parseNotificationWithAI()`: Usa Claude/OpenAI para interpretar
  - `parseNotificationSimple()`: Parser fallback com regex (quando IA falhar)
  - Extrai: amount, type, description, accountName, category, confidence

### 3. **Componente Dashboard**
- `src/components/NotificationTransactionsReview.tsx`
  - Lista transações PENDING de notificações
  - Botões para confirmar/rejeitar
  - Feedback visual com status

### 4. **Guia Setup**
- `MACRODROID_SETUP.md`
  - Passo a passo Macrodroid
  - Configuração de URLs
  - Troubleshooting

## Schema Database

Atualizações necessárias em `prisma/schema.prisma`:

```prisma
model Transaction {
  // ... campos existentes ...
  
  status              String   @default("CONFIRMED")  // Agora suporta PENDING
  source              String   @default("MANUAL")     // MANUAL, NOTIFICATION, WEBHOOK, etc
  metadata            Json?    // Armazena dados da notificação (após migration)
  
  // ... resto ...
}
```

## Fluxo de Dados - Exemplo Real

### Request do Macrodroid:
```json
POST /api/webhooks/notifications
{
  "title": "PicPay",
  "text": "Debora Ribeiro enviou um Pix de R$20,00 para voce.",
  "appPackage": "com.picpay",
  "familyId": "abc123"
}
```

### Processamento:
1. Valida se familia existe ✓
2. Encontra usuário ADMIN da família ✓
3. Concatena title + text: "PicPay - Debora Ribeiro enviou um Pix..."
4. Chama `parseNotificationWithAI()` com este texto
5. OpenAI interpreta e retorna:
   ```json
   {
     "amount": 20.00,
     "type": "INCOME",
     "description": "Pix recebido de Debora Ribeiro",
     "accountName": "PicPay",
     "category": "Receita",
     "person": "Debora Ribeiro",
     "confidence": 0.95
   }
   ```
6. Encontra conta `PicPay` na db
7. Cria Transaction:
   ```sql
   INSERT INTO Transaction (
     familyId, userId, accountId, categoryId,
     type, amount, description, date,
     status, source
   ) VALUES (
     'abc123', 'admin-user-id', 'picpay-account-id', 'receita-category-id',
     'INCOME', 20.00, 'Pix recebido de Debora Ribeiro',
     NOW(), 'PENDING', 'NOTIFICATION'
   )
   ```

### Response:
```json
{
  "success": true,
  "transaction": {
    "id": "trans123",
    "description": "Pix recebido de Debora Ribeiro",
    "amount": 20,
    "type": "INCOME",
    "status": "PENDING",
    "account": "PicPay",
    "person": "Debora Ribeiro",
    "confidence": 0.95
  },
  "message": "Transação criada como PENDING. Revise no app antes de confirmar."
}
```

### Dashboard:
- Transação aparece em amarelo com badge "PENDENTE"
- Usuário clica "Confirmar" ou "Rejeitar"
- Se confirmar: status → CONFIRMED
- Se rejeitar: transação é deletada

## Configuração Macrodroid

### Variáveis que pode usar:
```
$notification_text    → Corpo da mensagem
$notification_title   → Título
$notification_ticker  → Linha resumida
$notification_app     → Nome do app
```

### Exemplo de JSON no Macrodroid:
```json
{
  "title": "PicPay",
  "text": "$notification_text",
  "appPackage": "com.picpay",
  "familyId": "SEU_ID_AQUI"
}
```

URL do webhook:
```
https://seu-dominio.com/api/webhooks/notifications
```

OU para localhost (teste):
```
http://192.168.1.100:3000/api/webhooks/notifications
```

## Tratamento de Erros

Se algo der errado:

### "Conta não encontrada"
```json
{
  "error": "Conta \"PicPay\" não encontrada. Crie a conta primeiro.",
  "parsed": { "accountName": "PicPay", ... },
  "nextSteps": ["1. Crie uma conta com nome exato", "2. Tente novamente"]
}
```
→ Solução: Criar a conta no app com nome que o parser esperou

### "Usuário admin não encontrado"
```json
{
  "error": "Nenhum usuário ADMIN encontrado na família"
}
```
→ Solução: Certificar que tem pelo menos um usuário ADMIN na família

### "Notificação não interpretada"
```json
{
  "error": "Não foi possível interpretar a notificação"
}
```
→ Solução: Ajustar o prompt em `parseNotificationWithAI()` para seu formato de mensagem

## Segurança

Implementar na v2:
- [ ] Validar API key (header autorização)
- [ ] Validar origem IP (Macrodroid IP)
- [ ] Rate limiting (máx X requisições/minuto)
- [ ] Logging de todas as tentativas
- [ ] Auditoria de transações criadas automaticamente

## Performance

- Parser OpenAI: ~1-2 segundos (dependendo da latência OpenAI)
- Queries DB: <100ms cada
- Total: ~2-3 segundos por notificação
- Pode processar múltiplas notificações em paralelo

## Próximos Passos Sugeridos

1. **Auto-confirm transações** com confidence > 0.9
2. **Email digest** de transações PENDING diariamente
3. **Webhook de confirmação** para enviar push quando criada
4. **Suporte SMS**: Integrar com Twilio
5. **Suporte Email**: Parser de emails de banco
6. **Histórico**: Armazenar todas as notificações em tabela separada
7. **Analytics**: Dashboard mostrando % de sucesso do parser

---

✅ Pronto para usar! Siga o guia em **MACRODROID_SETUP.md**
