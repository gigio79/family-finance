# 📱 Exemplos de Mensagens - Formatos Suportados

## PicPay - Exemplos Reais

### ✅ Pix Recebido
```
"Debora Ribeiro enviou um Pix de R$20,00 para voce."
→ Interpretado como: INCOME, R$20.00, PicPay, de Debora Ribeiro

"Você recebeu Pix de R$100,00 de João Silva"
→ Interpretado como: INCOME, R$100.00, PicPay, de João Silva

"Pix de R$50,00 recebido de Sua Mãe"
→ Interpretado como: INCOME, R$50.00, PicPay
```

### ✅ Pix Enviado
```
"Você enviou Pix de R$100,00 para João Silva"
→ Interpretado como: EXPENSE, R$100.00, PicPay, para João Silva

"Você pagou com Pix: R$35,90"
→ Interpretado como: EXPENSE, R$35.90, PicPay

"Transferência de R$200,00 enviada para Maria"
→ Interpretado como: EXPENSE, R$200.00, PicPay, para Maria
```

### ✅ Compra em QR Code
```
"Você pagou R$12,50 com QR Code na Padaria do João"
→ Interpretado como: EXPENSE, R$12.50, PicPay, em Padaria do João

"Pagamento de R$45,00 via QR Code confirmado"
→ Interpretado como: EXPENSE, R$45.00, PicPay
```

## Mercado Pago - Exemplos Reais

### ✅ Compra Realizada
```
"Você pagou R$35,90 em SuperMercado XYZ com Pix"
→ Interpretado como: EXPENSE, R$35.90, Mercado Pago

"Compra de R$89,99 confirmada no SuperMercado"
→ Interpretado como: EXPENSE, R$89.99, Mercado Pago

"Pagamento de R$150,00 no Supermercado Carrefour"
→ Interpretado como: EXPENSE, R$150.00, Mercado Pago
```

### ✅ Transferência Recebida
```
"Você recebeu R$50,00 de transferência de Maria"
→ Interpretado como: INCOME, R$50.00, Mercado Pago, de Maria

"Transferência de R$200,00 recebida"
→ Interpretado como: INCOME, R$200.00, Mercado Pago
```

### ✅ Reembolso/Devolução
```
"Reembolso de R$120,00 processado"
→ Interpretado como: INCOME, R$120.00, Mercado Pago

"Sua devolução de R$85,50 foi aprovada"
→ Interpretado como: INCOME, R$85.50, Mercado Pago
```

## Formatos Ambíguos (⚠️ Cuidado)

Estes podem não ser interpretados corretamente:

### ❌ Sem Valor Explícito
```
"Nova fatura da sua conta"
→ NÃO consegue extrair valor
→ Falha: valor não encontrado

"Seu Pix foi recebido"
→ NÃO consegue extrair valor
→ Falha: valor não encontrado
```

### ❌ Formato muito diferente
```
"Transação processada"
→ Muito genérico

"Alerta de segurança: novo login"
→ Não é transação financeira
```

### ❌ Símbolos diferentes
```
"Você pagou USD 50,00"
→ Formato esperado: R$, não USD
→ Pode falhar ou interpretar errado
```

## Como Melhorar o Parser

Se sua mensagem não for reconhecida, você pode ajustar o prompt em:
`src/lib/notification-parser.ts`

### Exemplo: Adicionar suporte para BRL

Edite a função `parseNotificationWithAI`:

```typescript
export async function parseNotificationWithAI(
  notification: string,
  appPackage: string
): Promise<ParsedNotification | null> {
  try {
    const prompt = `Analise esta notificação de banco e extraia os dados estruturados.

NOTIFICAÇÃO: "${notification}"
APP: ${appPackage || 'desconhecido'}

Responda em JSON válido com exatamente estes campos:
{
  "amount": número positivo sem símbolo,
  "type": "INCOME" ou "EXPENSE",
  "description": descrição curta (máx 50 caracteres),
  "accountName": nome da conta (PicPay, Mercado Pago, banco, etc),
  "category": categoria (opcional): Alimentação, Transporte, Salário, Compras, Serviços, etc,
  "person": pessoa envolvida (se houver),
  "confidence": número de 0 a 1
}

REGRAS:
- Se é PIX RECEBIDO, TRANSFERÊNCIA RECEBIDA, TED RECEBIDA → INCOME
- Se é PIX ENVIADO, COMPRA, PAGAMENTO, TRANSFERÊNCIA ENVIADA → EXPENSE
- Extrai números com R$, BRL, ou apenas números
- Aceita formatos: R$ 20,00 ou R$ 20.00 ou 20,00
- confidence: 1.0 se está muito claro, 0.7+ se tem que inferir algo
- Se não conseguir parsing, retorne null`;
    
    // ... resto do código ...
  }
}
```

## Testando Novos Formatos

Use o script de teste para validar seus formatos:

```bash
npm run test:webhook http://localhost:3000 seu-family-id
```

Ou adicione um novo case no arquivo de testes:

```typescript
// scripts/test-notification-webhook.ts

const newExample = {
  name: '✅ Seu Banco - Seu Formato Específico',
  body: {
    title: 'Seu Banco',
    text: 'Sua mensagem customizada aqui...',
    appPackage: 'com.seu.banco'
  },
  expected: {
    type: 'INCOME',
    amount: 123.45,
    account: 'Seu Banco'
  }
};

examples.push(newExample);
```

## Categorização Automática

O parser tenta adivinhar a categoria. Exemplos:

```
"Você pagou R$100,00 em Padaria" 
→ Categoria: "Alimentação"

"Uber: R$35,50"
→ Categoria: "Transporte"

"Salário de R$3.500,00"
→ Categoria: "Salário" ou "Receita"

"Apple Music: R$19,90"
→ Categoria: "Entretenimento" (se existir)
```

Se quiser melhorar, ajuste em `notification-parser.ts`:

```typescript
// Adicione lógica de categorização
function guessCategory(description: string): string | undefined {
  if (/padaria|restaurante|alimentação|supermercado/i.test(description)) {
    return 'Alimentação';
  }
  if (/uber|taxi|passagem|transporte/i.test(description)) {
    return 'Transporte';
  }
  if (/salário|bônus|pagamento/i.test(description)) {
    return 'Salário';
  }
  // ... mais regras ...
  return undefined;
}
```

## Casos de Erro Comum

### 1. Mensagem com Emojis
```
"💰 Você recebeu R$100,00 📱"
→ ✅ Funciona (IA ignora emojis)
```

### 2. Mensagem com Múltiplos Valores
```
"Você pagou R$50,00 em 2x de R$25,00"
→ ⚠️ Pode capturar o primeiro valor (R$50)
→ Solução: Usar o maior valor ou o total
```

### 3. Valores em Real vs Dólar
```
"Você pagou USD 100,00"
→ ❌ Não reconhece USD automaticamente
→ Solução: Converter ou ajustar parser
```

### 4. Valores muito grandes (pode parecer erro)
```
"Você transferiu R$1.234.567,89"
→ ✅ Funciona (1234567.89)
→ Dashboard pode mostrar com separadores
```

## Confiança do Parser

O campo `confidence` indica o quão certo o parser está:

```
Confidence: 0.95+ (95%+)
→ Mensagem muito clara
→ Dados bem estruturados
→ Sugestão: auto-confirmar

Confidence: 0.80-0.95
→ Mensagem clara mas com pouca inferência
→ Revisar antes de confirmar

Confidence: 0.70-0.80
→ Mensagem ambígua
→ Precisa confirmar manualmente

Confidence: < 0.70
→ Muito incerto
→ Pode estar errado
→ Revisar com atenção
```

Ajuste em `parseNotificationWithAI()` para aumentar/diminuir confidence conforme necessário.

## Coletando Novos Formatos

Quando encontrar um formato que não funciona:

1. **Copie a mensagem exata** que recebeu
2. **Note o app** (PicPay, Mercado Pago, etc)
3. **Teste com curl ou seu script** para ver a resposta
4. **Adicione caso de teste** em `scripts/test-notification-webhook.ts`
5. **Ajuste o prompt** em `src/lib/notification-parser.ts` se necessário

Exemplo de requisição para debug:

```bash
curl -X POST http://localhost:3000/api/webhooks/notifications \
  -H "Content-Type: application/json" \
  -d '{
    "title": "PicPay",
    "text": "SUA MENSAGEM AQUI",
    "appPackage": "com.picpay",
    "familyId": "seu-id"
  }' | jq '.'
```

---

**Dica**: Quanto mais exemplos você testar, melhor o sistema fica! Se encontrar um formato que não funciona, ajuste o parser e compartilhe nos testes.
