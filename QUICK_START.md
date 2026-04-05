# ⚡ Quick Start - Automação Macrodroid

## Resumo do que foi criado

```
✅ Webhook endpoint: POST /api/webhooks/notifications
✅ Parser IA: parseNotificationWithAI() com fallback regex
✅ Componente Dashboard: NotificationTransactionsReview
✅ Suporte banco de dados: status PENDING, source NOTIFICATION, metadata JSON
✅ Script de teste: npm run test:webhook
✅ Documentação completa: MACRODROID_SETUP.md
```

## 🚀 Primeiros Passos

### Passo 1: Criar as Contas
```
Dashboard → Accounts → Criar Nova Conta
- Nome: "PicPay"      (tipo: BANK)
- Nome: "Mercado Pago" (tipo: BANK)
```

### Passo 2: Migration do Banco (quando banco estiver online)
```bash
npm run db:migrate -- --name add_metadata_to_transaction
```

### Passo 3: Testar o Webhook
```bash
npm run dev

# Em outro terminal:
npm run test:webhook http://localhost:3000 SEU_FAMILY_ID_AQUI
```

💡 Encontre seu Family ID:
- Console do navegador (F12)
- Execute: `JSON.parse(localStorage.getItem("session") || "{}").familyId`

### Passo 4: Setup Macrodroid
- Baixe: [Google Play - Macrodroid](https://play.google.com/store/apps/details?id=com.arlosoft.macrodroid)
- Siga: [MACRODROID_SETUP.md](./MACRODROID_SETUP.md)

## 📁 Arquivos Criados/Modificados

```
NOVO:
├── src/app/api/webhooks/notifications/route.ts   (endpoint webhook)
├── src/lib/notification-parser.ts                  (parser IA)
├── src/components/NotificationTransactionsReview.tsx (componente)
├── scripts/test-notification-webhook.ts            (testes)
├── MACRODROID_SETUP.md                            (guia completo)
├── NOTIFICATION_AUTOMATION_TECH.md                (tech details)
└── QUICK_START.md                                 (este arquivo)

MODIFICADO:
├── prisma/schema.prisma                           (+ metadata field)
├── src/app/api/transactions/route.ts              (+ filter source)
└── package.json                                   (+ scripts)
```

## 🔧 Comandos Úteis

```bash
# Desenvolvimento
npm run dev

# Testar webhook (com seu ID de família)
npm run test:webhook http://localhost:3000 abc123

# Abrir interface Prisma
npm run db:studio

# Fazer migration do banco
npm run db:migrate

# Build para produção
npm run build && npm start
```

## 📱 Fluxo Completo

```
1️⃣  Você recebe mensagem de banco no celular
    ↓
2️⃣  Macrodroid captura notificação (automático)
    ↓
3️⃣  Envia para webhook /api/webhooks/notifications
    ↓
4️⃣  OpenAI interpreta a mensagem
    ↓
5️⃣  Transação criada com status PENDING
    ↓
6️⃣  Dashboard mostra "Transações Pendentes de Notificação"
    ↓
7️⃣  Você clica "Confirmar" ou "Rejeitar"
    ↓
8️⃣  Status muda para CONFIRMED ou deletada
```

## 🧪 Exemplo Real

Você recebe no WhatsApp/SMS do PicPay:
```
"Debora Ribeiro enviou um Pix de R$20,00 para voce."
```

Sistema interpreta como:
```
{
  "type": "INCOME",
  "amount": 20.00,
  "description": "Pix recebido de Debora Ribeiro",
  "account": "PicPay",
  "person": "Debora Ribeiro",
  "confidence": 95%
}
```

E cria no seu app automaticamente!

## ⚠️ Troubleshooting Rápido

| Problema | Solução |
|----------|---------|
| "Conta não encontrada" | Crie as contas "PicPay" e "Mercado Pago" exatamente com esse nome |
| "Webhook não funciona" | Teste com `npm run test:webhook` primeiro |
| "Parser não reconhece formato" | Envie exemplo de mensagem real para ajustar prompt em `notification-parser.ts` |
| "Banco não responde" | Espere conexão ou use ambiente local para testes |

## 📊 Próximas Features

- [ ] Auto-confirmar se confiança > 90%
- [ ] Histórico de notificações
- [ ] Email digest diário
- [ ] SMS + Email parsing
- [ ] Webhook de confirmação (push)
- [ ] Dashboard de analytics

## 💡 Dicas

1. **Teste primeiro**: Use `npm run test:webhook` antes de publicar
2. **Revise sempre**: Transações começam como PENDING - revise antes de confirmar
3. **Macrodroid Premium**: Vale a pena para mais automações
4. **Personalize**: Ajuste prompts de IA em `notification-parser.ts` para seu estilo de mensagem

## 📞 Suporte

Se tiver dúvidas:
1. Leia [MACRODROID_SETUP.md](./MACRODROID_SETUP.md) completo
2. Veja [NOTIFICATION_AUTOMATION_TECH.md](./NOTIFICATION_AUTOMATION_TECH.md) para detalhes técnicos
3. Teste com: `npm run test:webhook`
4. Verifique logs do servidor (desenvolvimento)

---

**Pronto para começar?** 🚀

1. Crie as contas no app
2. Execute `npm run test:webhook`
3. Configure Macrodroid
4. Aproveite a automação!

Qualquer dúvida, os guias acima têm tudo que você precisa.
