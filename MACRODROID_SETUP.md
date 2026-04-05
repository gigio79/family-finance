# 📱 Macrodroid Integration - Guia de Setup

## Visão Geral

Você pode usar **Macrodroid** para capturar notificações de apps (PicPay, Mercado Pago, etc) e enviar automaticamente para o Family Finance por webhook. A IA OpenAI interpreta a mensagem e cria a transação.

## 🔧 Passo 1: Setup no Backend

### 1.1 Criar a conta no app (importante!)

Antes de tudo, crie as contas no seu app:

1. Acesse Dashboard → Accounts
2. Crie conta tipo **BANK** com nome exato:
   - `PicPay` (para capturar notificações PicPay)
   - `Mercado Pago` (para Mercado Pago)

⚠️ **O nome deve estar exato!** O webhook procura por esse nome.

### 1.2 Familiarize-se com o Endpoint

```
POST /api/webhooks/notifications

Body exemplo:
{
  "title": "PicPay",
  "text": "Debora Ribeiro enviou um Pix de R$20,00 para voce.",
  "appPackage": "com.picpay",
  "familyId": "sua-family-id-aqui"
}

Response:
{
  "success": true,
  "transaction": {
    "id": "xxx",
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

### 1.3 Onde encontrar seu Family ID

1. Abra o console do navegador (F12)
2. Execute no console:
   ```javascript
   // Vejo seu family ID do localStorage
   JSON.parse(localStorage.getItem('session')).familyId
   ```
3. Copie e guarde esse ID

## 📲 Passo 2: Setup no Macrodroid

### 2.1 Instalar Macrodroid

1. Download: [Google Play - Macrodroid](https://play.google.com/store/apps/details?id=com.arlosoft.macrodroid)
2. Instale e abra o app
3. Conceda todas as permissões necessárias:
   - Notificações
   - Acessibilidade (essencial para capturar notificações)
   - Rede

### 2.2 Criar Automação para PicPay

1. **Toque em "Create Macro"** (ou +)

2. **Tipo de Trigger: "Notification"**
   - Trigger Type: `Application Notification`
   - Selecione app: `PicPay`
   - Não selecione opção de "Precise match"

3. **Ação: "HTTP Request"**
   - Method: `POST`
   - URL: `https://seu-dominio.com/api/webhooks/notifications`
   - Body Format: `JSON`
   - Body:
     ```json
     {
       "title": "PicPay",
       "text": "$notification_text",
       "appPackage": "com.picpay",
       "familyId": "SEU_FAMILY_ID_AQUI"
     }
     ```

4. **Nome da Macro:** "Family Finance - PicPay"
5. **Salve e ative!** ✅

### 2.3 Criar Automação para Mercado Pago

Repita o processo anterior, mas:

- **Notificação:** `Mercado Pago` app
- **JSON Body:**
  ```json
  {
    "title": "Mercado Pago",
    "text": "$notification_text",
    "appPackage": "com.mercadopago",
    "familyId": "SEU_FAMILY_ID_AQUI"
  }
  ```
- **Nome da Macro:** "Family Finance - Mercado Pago"

### 2.4 Variáveis Disponíveis no Macrodroid

```
$notification_text    → Texto completo da notificação
$notification_title   → Título da notificação
$notification_ticker  → Ticker (ticker text)
$notification_app     → Nome do app que enviou
```

Se precisar de mais informações, use `$notification_ticker` além de `$notification_text`.

## 🧪 Passo 3: Testando

### Teste Local (sem publicar)

1. Em desenvolvimento, acesse: `http://localhost:3000/api/webhooks/notifications`
2. Abra seu celular na mesma rede
3. Use Postman ou curl para simular uma notificação:

```bash
curl -X POST http://seu-ip-local:3000/api/webhooks/notifications \
  -H "Content-Type: application/json" \
  -d '{
    "title": "PicPay",
    "text": "Debora Ribeiro enviou um Pix de R$20,00 para voce.",
    "appPackage": "com.picpay",
    "familyId": "sua-family-id"
  }'
```

### Teste com Macrodroid

1. Ative a macro no Macrodroid
2. Use o app real (PicPay/Mercado Pago) para fazer uma transação
3. Você receberá uma notificação normalmente
4. A automação do Macrodroid acionará o webhook
5. Verifique a dashboard → Transaction → status PENDING

## 📋 Formatos de Notificação Suportados

Seu parser suporta notificações em português, como:

### PicPay
- ✅ "Debora Ribeiro enviou um Pix de R$20,00 para voce."
- ✅ "Você recebeu Pix de R$100,00 de João"
- ✅ "Pix enviado: R$50,00 para Maria"

### Mercado Pago
- ✅ "Você pagou R$35,90 no Supermercado XYZ"
- ✅ "Transferência de R$200,00 confirmada"
- ✅ "Seu Pix de R$15,00 foi entregue"

## 🔐 Segurança

### Opção 1: API Key Simples (recomendada para testes)

```json
{
  "title": "PicPay",
  "text": "$notification_text",
  "appPackage": "com.picpay",
  "familyId": "SEU_FAMILY_ID_AQUI",
  "apiKey": "SEU_TOKEN_SECRETO"
}
```

Depois valide no webhook (implementar).

### Opção 2: Usar HTTPS Apenas

Seu domínio deve estar em HTTPS. Macrodroid suporta isso.

### Opção 3: IP Whitelist (avançado)

Configure seu firewall para aceitar requests apenas do seu telefone (seu IP estático).

## 🚀 Deploy em Produção

Quando publicar, certifique-se de:

1. ✅ Domínio com HTTPS válido
2. ✅ Variáveis de ambiente `.env` setadas (OPENAI_API_KEY)
3. ✅ Database reachable
4. ✅ URL do webhook em produção (ex: `https://seu-app.com/api/webhooks/notifications`)

## 🐛 Troubleshooting

### "Transação criada mas valor errado"

O parser OpenAI não reconheceu o formato. Tente:
1. Copie a mensagem exata que aparece
2. Ajuste o prompt em `src/lib/notification-parser.ts`
3. Faça teste direto com curl

### "Conta não encontrada"

Erro assim significa nomes não batem:
```
{
  "error": "Conta \"PicPay\" não encontrada. Crie a conta primeiro.",
  "parsed": {
    "amount": 20,
    "accountName": "PicPay"
  }
}
```

**Solução:** Crie a conta no app com o nome exato que aparece em `accountName`.

### "Webhook não está funcionando"

1. Teste com curl primeiro:
   ```bash
   curl -X POST https://seu-app.com/api/webhooks/notifications \
     -H "Content-Type: application/json" \
     -d '{"title":"Test","text":"Test","familyId":"xxx"}'
   ```

2. Verifique logs do Macrodroid:
   - Abra Macrodroid → Configurações → Logs
   - Procure por erros de conexão

3. Verifique permissões de rede:
   - Se tiver VPN, desative
   - Se tiver firewall corporativo, adicione whitelist

## 📊 Dashboard - Revisar Transações PENDING

1. Acesse Dashboard → Transactions
2. Filtre por `Status: PENDING`
3. Revise cada transação capturada
4. Confirme ou edite conforme necessário
5. A transação passa a `CONFIRMED`

## 📈 Próximos Passos

1. **Auto-categorização melhorada:** O parser já tenta categorizar, mas você pode ajustar as categorias

2. **SMS + Email:** Implementar algo similar para SMS e Email quando quiser

3. **Webhook de confirmação:** Enviar notificação push quando transação é criada

4. **Histórico de notificações:** Armazenar no banco para auditoria

5. **Relatórios:** Gerar relatórios com transações importadas via notificações

## 💡 Tips

- Use **emoji na descrição** para visualizar melhor no app:
  ```json
  "description": "💰 Pix recebido de Debora Ribeiro"
  ```

- Se quer ignorar certos tipos de notificação, ajuste o filter do Macrodroid (ex: notificações de promoção)

- Macrodroid pode estar em standby - certifique-se que não está restringido na bateria do telefone

---

**Pronto! Você tem uma integração de notificações automática com IA!** 🎉

Qualquer dúvida, verifique os logs em `src/lib/notification-parser.ts` e ajuste os prompts de IA conforme necessário.
