import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ParsedNotification {
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  description: string;
  accountName: string;
  category?: string;
  confidence: number; // 0-1
  person?: string;
}

/**
 * Usa OpenAI para interpretar notificações de banco
 * Extrai: valor, tipo (entrada/saída), descrição, conta, categoria
 */
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
- Extraia apenas números, sem R$ ou símbolos
- confidence: 1.0 se está muito claro, 0.7+ se tem que inferir algo
- Se não conseguir parsing, retorne null

Exemplo entrada: "Debora Ribeiro enviou um Pix de R$20,00 para voce."
Exemplo resposta:
{
  "amount": 20.00,
  "type": "INCOME",
  "description": "Pix recebido de Debora Ribeiro",
  "accountName": "PicPay",
  "category": "Receita",
  "person": "Debora Ribeiro",
  "confidence": 0.95
}`;

    const message = await openai.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      return null;
    }

    // Extrai JSON da resposta
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('Não foi possível encontrar JSON na resposta:', content.text);
      return null;
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Validação básica
    if (
      !parsed.amount ||
      !parsed.type ||
      !parsed.description ||
      !parsed.accountName ||
      parsed.confidence === undefined
    ) {
      return null;
    }

    return {
      amount: parseFloat(parsed.amount),
      type: parsed.type,
      description: parsed.description,
      accountName: parsed.accountName || 'Desconhecida',
      category: parsed.category,
      confidence: parsed.confidence,
      person: parsed.person
    };

  } catch (error) {
    console.error('Erro ao fazer parse com OpenAI:', error);
    return null;
  }
}

/**
 * Parser alternativo mais simples usando regex
 * Para quando OpenAI não está disponível
 */
export function parseNotificationSimple(
  notification: string,
  appPackage: string
): ParsedNotification | null {
  try {
    // Padrão: "Pessoa enviou um Pix de R$ 20,00 para voce."
    // ou "Você recebeu Pix de R$ 100,00"
    // ou "Você pagou com Pix: R$ 50,00"

    const amountMatch = notification.match(/R\$\s*([\d.,]+)/);
    if (!amountMatch) return null;

    let amount = parseFloat(
      amountMatch[1].replace('.', '').replace(',', '.')
    );

    // Detecta tipo (recebeu vs enviou/pagou)
    const isIncome =
      /receb|enviou.*para voce|transfered? to|pix in/i.test(notification);

    const type = isIncome ? 'INCOME' : 'EXPENSE';

    // Detecta pessoa
    const personMatch = notification.match(/^([A-Za-z\s]+?)(?:\s+enviou|\s+recebeu|$)/);
    const person = personMatch?.[1]?.trim();

    // Detecta conta
    let accountName = 'Desconhecida';
    if (/picpay/i.test(notification) || /picpay/i.test(appPackage)) {
      accountName = 'PicPay';
    } else if (/mercado\s*pago/i.test(notification) || /com\.mercadopago/i.test(appPackage)) {
      accountName = 'Mercado Pago';
    }

    const description = person
      ? `${type === 'INCOME' ? 'Recebido' : 'Enviado'} para ${person}`
      : isIncome
      ? 'Transferência recebida'
      : 'Transferência enviada';

    return {
      amount,
      type,
      description,
      accountName,
      confidence: 0.7 // Menos confiança que IA
    };

  } catch (error) {
    console.error('Erro ao fazer parse simples:', error);
    return null;
  }
}
