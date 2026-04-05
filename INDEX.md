# 📑 Índice Completo - Automação Macrodroid

## 🗂️ Arquivos Criados

### Documentação
| Arquivo | Propósito |
|---------|-----------|
| [QUICK_START.md](./QUICK_START.md) | ⚡ Início rápido - 5 minutos |
| [MACRODROID_SETUP.md](./MACRODROID_SETUP.md) | 📱 Setup completo do Macrodroid |
| [MESSAGE_FORMATS.md](./MESSAGE_FORMATS.md) | 📋 Exemplos de mensagens reconhecidas |
| [NOTIFICATION_AUTOMATION_TECH.md](./NOTIFICATION_AUTOMATION_TECH.md) | 🔧 Detalhes técnicos (para devs) |
| [COMPONENT_INTEGRATION.md](./COMPONENT_INTEGRATION.md) | 🎨 Integrar componente na dashboard |

### Backend
| Arquivo | Função |
|---------|--------|
| `src/app/api/webhooks/notifications/route.ts` | POST endpoint para capturar notificações |
| `src/lib/notification-parser.ts` | Parser com IA (OpenAI) + fallback regex |

### Frontend
| Arquivo | Função |
|---------|--------|
| `src/components/NotificationTransactionsReview.tsx` | Componente visual para revisar transações |

### Testes
| Arquivo | Função |
|---------|--------|
| `scripts/test-notification-webhook.ts` | Script para testar webhook (npm run test:webhook) |

### Config
| Arquivo | Modificado | Detalhes |
|---------|-----------|----------|
| `prisma/schema.prisma` | ✅ | Campo `metadata` adicionado |
| `src/app/api/transactions/route.ts` | ✅ | Suporte para filtrar por `source` |
| `package.json` | ✅ | Novos scripts adicionados |

---

## 🚀 Fluxo de Setup Recomendado

### 1️⃣ Leitura (5 min)
Leia: **[QUICK_START.md](./QUICK_START.md)**

### 2️⃣ Banco de Dados (1-2 min)
```bash
npm run db:migrate -- --name add_metadata_to_transaction
```
**Se der erro de conexão**: tudo bem, fazer depois

### 3️⃣ Teste Local (5 min)
```bash
npm run dev
# Em outro terminal
npm run test:webhook http://localhost:3000 SEU_FAMILY_ID
```

### 4️⃣ Criar Contas (1 min)
Dashboard → Accounts
- [ ] "PicPay"
- [ ] "Mercado Pago"

### 5️⃣ Setup Macrodroid (10 min)
Leia: **[MACRODROID_SETUP.md](./MACRODROID_SETUP.md)** → Passo 2

### 6️⃣ Integrar Componente (5 min)
Leia: **[COMPONENT_INTEGRATION.md](./COMPONENT_INTEGRATION.md)**
Adicione ao `src/app/dashboard/transactions/page.tsx`

### 7️⃣ Deploy (opcional)
```bash
npm run build
npm start
```

---

## 📞 Referência Rápida

### Endpoints

| Método | Endpoint | Propósito |
|--------|----------|-----------|
| POST | `/api/webhooks/notifications` | Receber notificações do Macrodroid |
| GET | `/api/transactions?status=PENDING` | Listar transações pendentes |
| GET | `/api/transactions?source=NOTIFICATION` | Listar transações de notificação |
| PATCH | `/api/transactions/:id` | Confirmar/editar transação |
| DELETE | `/api/transactions/:id` | Rejeitar transação |

### Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Iniciar servidor desenvolvimento |
| `npm run test:webhook` | Testar webhook (precisa de args) |
| `npm run db:studio` | Abrir Prisma Studio |
| `npm run db:migrate` | Fazer migration do banco |
| `npm run build` | Build para produção |

### Variáveis de Ambiente

```env
OPENAI_API_KEY=sk-...          # Para parser IA
DATABASE_URL=postgresql://...  # Conexão banco
```

---

## ⚠️ Troubleshooting Rápido

### "Conta não encontrada"
👉 Crie contas com nomes exatos:
- Dashboard → Accounts
- Nome: "PicPay" (tipo: BANK)
- Nome: "Mercado Pago" (tipo: BANK)

### "webhook não funciona"
👉 Teste com:
```bash
npm run test:webhook http://localhost:3000 seu-id
```

### "Banco não conecta"
👉 Se for erro de conexão ao fazer migration:
```bash
# Tente depois quando banco estiver online
npm run db:migrate -- --name add_metadata_to_transaction
```

### "Mensagem não é reconhecida"
👉 Veja [MESSAGE_FORMATS.md](./MESSAGE_FORMATS.md)
👉 Ajuste prompt em `src/lib/notification-parser.ts`

---

## 📊 Fluxo de Dados Resumido

```
Notificação (PicPay/Mercado Pago)
            ↓
        Macrodroid
            ↓
    POST /api/webhooks/notifications
            ↓
    Valida família + usuário admin
            ↓
    ParseNotificationWithAI (OpenAI)
            ↓
    Encontra conta pelo nome
            ↓
    Cria Transaction (status: PENDING)
            ↓
    NotificationTransactionsReview (UI)
            ↓
    Usuário: Confirma ou Rejeita
            ↓
    Status: CONFIRMED ou deletada
```

---

## 🎯 Checklist de Setup Completo

- [ ] Li [QUICK_START.md](./QUICK_START.md)
- [ ] Executei `npm run test:webhook` com sucesso
- [ ] Criei contas "PicPay" e "Mercado Pago" na dashboard
- [ ] Instalei Macrodroid no celular
- [ ] Configurei 1ª automação (PicPay) em MACRODROID_SETUP.md
- [ ] Configurei 2ª automação (Mercado Pago)
- [ ] Integrei NotificationTransactionsReview na dashboard
- [ ] Testei recebendo notificação real
- [ ] Confirmei transação na dashboard

---

## 💡 Dicas Importantes

1. **Guarde seu Family ID**
   ```javascript
   // Console: Ctrl+Shift+K ou F12
   JSON.parse(localStorage.getItem("session") || "{}").familyId
   ```

2. **Use HTTPS em produção**
   Macrodroid funciona com HTTPS válido

3. **Teste primeiro localmente**
   Antes de publicar, rode `npm run test:webhook`

4. **Revise sempre transações PENDING**
   Não auto-confirme ainda (v2 feature)

5. **Mantenha Macrodroid atualizado**
   Google Play → Macrodroid → Atualizar

---

## 📚 Documentação Por Caso de Uso

### "Quero usar Macrodroid mas não sei por onde começar"
👉 [QUICK_START.md](./QUICK_START.md) + [MACRODROID_SETUP.md](./MACRODROID_SETUP.md)

### "Minha mensagem não é reconhecida"
👉 [MESSAGE_FORMATS.md](./MESSAGE_FORMATS.md)

### "Quero integrar o componente na minha página"
👉 [COMPONENT_INTEGRATION.md](./COMPONENT_INTEGRATION.md)

### "Quero entender como funciona (dev)"
👉 [NOTIFICATION_AUTOMATION_TECH.md](./NOTIFICATION_AUTOMATION_TECH.md)

### "Preciso de detalhes da API"
👉 [NOTIFICATION_AUTOMATION_TECH.md](./NOTIFICATION_AUTOMATION_TECH.md) → Fluxo de Dados

---

## 🔐 Segurança

### Atual
- ✅ **Transações PENDING**: Você revisa antes de confirmar
- ✅ **Multi-tenant**: Cada família tem seus dados isolados
- ✅ **Família obrigatória**: Webhook valida familyId

### Próximos (v2+)
- [ ] API Key validation
- [ ] Rate limiting
- [ ] IP whitelist
- [ ] Audit log completo
- [ ] Notificação ao usuário

---

## 📈 Roadmap

### v1 (Atual)
- ✅ Capturar notificações do celular
- ✅ Parser com IA (OpenAI)
- ✅ Criar transações PENDING
- ✅ Revisor visual na dashboard

### v1.5 (Próximo)
- [ ] Auto-confirmar se confidence > 90%
- [ ] Histórico de notificações
- [ ] Email digest diário
- [ ] Push notification ao criar

### v2
- [ ] SMS parsing (Twilio)
- [ ] Email parsing (Gmail API)
- [ ] Webhook de confirmação
- [ ] Analytics de sucesso
- [ ] Telegram bot

---

## 📞 Resumo dos Arquivos para Consultar

| Dúvida | Arquivo |
|--------|---------|
| "Como começar?" | QUICK_START.md |
| "Como configurar Macrodroid?" | MACRODROID_SETUP.md |
| "Quais formatos funcionam?" | MESSAGE_FORMATS.md |
| "Como integrar componente?" | COMPONENT_INTEGRATION.md |
| "Detalhes técnicos?" | NOTIFICATION_AUTOMATION_TECH.md |

---

**Pronto para começar?** 🚀

Comece com [QUICK_START.md](./QUICK_START.md)

Qualquer dúvida, volte a este índice!
