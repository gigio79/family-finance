import { prisma } from './prisma';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import OpenAI from 'openai';
import { registerTransaction } from './transaction-service';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

interface ChatResponse {
    message: string;
    data?: Record<string, unknown>;
}

const patterns: { regex: RegExp; handler: (match: RegExpMatchArray, familyId: string) => Promise<ChatResponse> }[] = [
    {
        regex: /quanto\s+gast(amos|ei|ou)\s+(com|em)\s+(.+?)(\s+este\s+m[eê]s|\s+esse\s+m[eê]s|\s+no\s+m[eê]s)?$/i,
        handler: async (match, familyId) => {
            const category = match[3].trim();
            const now = new Date();
            const transactions = await prisma.transaction.findMany({
                where: {
                    familyId,
                    type: 'EXPENSE',
                    status: 'CONFIRMED',
                    date: { gte: startOfMonth(now), lte: endOfMonth(now) },
                    category: { name: { contains: category } },
                },
            });
            const total = transactions.reduce((s, t) => s + t.amount, 0);
            return {
                message: total > 0
                    ? `💰 Este mês, vocês gastaram **R$ ${total.toFixed(2)}** com ${category}. Foram ${transactions.length} transação(ões).`
                    : `Não encontrei gastos com "${category}" este mês.`,
                data: { total, count: transactions.length },
            };
        },
    },
    {
        regex: /qual\s+(a\s+)?maior\s+despesa/i,
        handler: async (_match, familyId) => {
            const now = new Date();
            const transaction = await prisma.transaction.findFirst({
                where: {
                    familyId,
                    type: 'EXPENSE',
                    status: 'CONFIRMED',
                    date: { gte: startOfMonth(now), lte: endOfMonth(now) },
                },
                orderBy: { amount: 'desc' },
                include: { category: true, user: true },
            });
            if (!transaction) return { message: 'Não há despesas registradas este mês.' };
            return {
                message: `🔝 A maior despesa do mês é **${transaction.description}** no valor de **R$ ${transaction.amount.toFixed(2)}** (${transaction.category?.name || 'Sem categoria'}), registrada por ${transaction.user.name}.`,
                data: { transaction },
            };
        },
    },
    {
        regex: /saldo\s+(atual|geral|total|da\s+fam[ií]lia)/i,
        handler: async (_match, familyId) => {
            const now = new Date();
            const transactions = await prisma.transaction.findMany({
                where: {
                    familyId,
                    status: 'CONFIRMED',
                    date: { gte: startOfMonth(now), lte: endOfMonth(now) },
                },
            });
            const income = transactions.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
            const expenses = transactions.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
            const balance = income - expenses;
            return {
                message: `📊 **Saldo do mês:**\n\n• Receitas: R$ ${income.toFixed(2)}\n• Despesas: R$ ${expenses.toFixed(2)}\n• **Saldo: R$ ${balance.toFixed(2)}**`,
                data: { income, expenses, balance },
            };
        },
    },
    {
        regex: /quantas?\s+transa[çc][ãõo]es?\s+(este|esse|no)\s+m[eê]s/i,
        handler: async (_match, familyId) => {
            const now = new Date();
            const count = await prisma.transaction.count({
                where: {
                    familyId,
                    date: { gte: startOfMonth(now), lte: endOfMonth(now) },
                },
            });
            return {
                message: `📋 Este mês vocês têm **${count} transação(ões)** registradas.`,
                data: { count },
            };
        },
    },
    {
        regex: /resumo\s+(do\s+m[eê]s|mensal|financeiro)/i,
        handler: async (_match, familyId) => {
            const now = new Date();
            const transactions = await prisma.transaction.findMany({
                where: {
                    familyId,
                    status: 'CONFIRMED',
                    date: { gte: startOfMonth(now), lte: endOfMonth(now) },
                },
                include: { category: true },
            });
            const income = transactions.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
            const expenses = transactions.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);

            // Top categories
            const catTotals: Record<string, number> = {};
            transactions.filter(t => t.type === 'EXPENSE').forEach(t => {
                const name = t.category?.name || 'Sem Categoria';
                catTotals[name] = (catTotals[name] || 0) + t.amount;
            });
            const topCats = Object.entries(catTotals).sort((a, b) => b[1] - a[1]).slice(0, 5);
            const catList = topCats.map(([name, val]) => `  • ${name}: R$ ${val.toFixed(2)}`).join('\n');

            return {
                message: `📊 **Resumo de ${format(now, 'MMMM/yyyy')}:**\n\n💚 Receitas: R$ ${income.toFixed(2)}\n🔴 Despesas: R$ ${expenses.toFixed(2)}\n💰 Saldo: R$ ${(income - expenses).toFixed(2)}\n\n🏷️ **Top categorias:**\n${catList || '  Nenhuma despesa registrada.'}`,
            };
        },
    },
];

export async function processChat(content: string, familyId: string, userId: string, fileData?: { base64: string; type: string }): Promise<string> {
    const normalized = content.trim().toLowerCase().replace(/[?!.]/g, '');

    // 1. Regex patterns (only if no file)
    if (!fileData) {
        for (const pattern of patterns) {
            const match = normalized.match(pattern.regex);
            if (match) {
                const result = await pattern.handler(match, familyId);
                return result.message;
            }
        }
    }

    // 2. OpenAI with Tools and Vision
    if (process.env.OPENAI_API_KEY) {
        try {
            const { logAiUsage, checkMonthlyLimit } = await import('./ai-usage');

            const { allowed, used } = await checkMonthlyLimit(familyId);
            if (!allowed) {
                return `⚠️ **Limite de IA atingido!** A sua família já utilizou o limite mensal de processamento de inteligência artificial (${used} tokens). Otimize o uso ou aguarde o próximo mês.`;
            }

            const now = new Date();
            const transactions = await prisma.transaction.findMany({
                where: { familyId, date: { gte: startOfMonth(now), lte: endOfMonth(now) }, status: 'CONFIRMED' },
                include: { category: true },
                take: 10,
                orderBy: { date: 'desc' },
            });

            const income = transactions.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
            const expenses = transactions.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);

            const systemPrompt = `
            Você é o Assistente Financeiro da Família.
            Contexto: Hoje é ${format(now, 'dd/MM/yyyy')}. 
            Saldo atual: R$ ${(income - expenses).toFixed(2)}.
            
            Se o usuário descrever um gasto ou enviar uma foto de nota fiscal, use a ferramenta 'register_transaction'.
            Tente categorizar corretamente (Alimentação, Transporte, Saúde, etc.). Se não existir, crie.
            Responda em português.
            `;

            const messages: any[] = [{ role: 'system', content: systemPrompt }];

            if (fileData) {
                messages.push({
                    role: 'user',
                    content: [
                        { type: 'text', text: content || 'O que você vê nesta nota fiscal?' },
                        { type: 'image_url', image_url: { url: `data:${fileData.type};base64,${fileData.base64}` } }
                    ]
                });
            } else {
                messages.push({ role: 'user', content });
            }

            const tools: OpenAI.Chat.ChatCompletionTool[] = [
                {
                    type: 'function',
                    function: {
                        name: 'register_transaction',
                        description: 'Registra uma nova transação (receita ou despesa) no banco de dados.',
                        parameters: {
                            type: 'object',
                            properties: {
                                description: { type: 'string', description: 'Descrição breve' },
                                amount: { type: 'number', description: 'Valor numérico' },
                                category: { type: 'string', description: 'Nome da categoria' },
                                date: { type: 'string', description: 'Data YYYY-MM-DD' },
                                type: { type: 'string', enum: ['INCOME', 'EXPENSE'] }
                            },
                            required: ['description', 'amount', 'category', 'type']
                        }
                    }
                }
            ];

            const completion = await openai.chat.completions.create({
                model: fileData ? 'gpt-4o-mini' : 'gpt-3.5-turbo',
                messages,
                tools,
                tool_choice: 'auto',
            });

            const message = completion.choices[0].message;

            // Log AI usage
            await logAiUsage({
                familyId,
                userId,
                actionType: fileData ? 'VISION_CHAT' : 'TEXT_CHAT',
                tokensInput: completion.usage?.prompt_tokens || 0,
                tokensOutput: completion.usage?.completion_tokens || 0
            });

            if (message.tool_calls) {
                for (const toolCall of message.tool_calls) {
                    if (toolCall.type === 'function') {
                        const fn = toolCall.function;
                        if (fn.name === 'register_transaction') {
                            const args = JSON.parse(fn.arguments);

                            const registration = await registerTransaction({
                                ...args,
                                familyId,
                                userId,
                                source: fileData ? 'VISION' : 'CHAT'
                            });

                            return registration.message;
                        }
                    }
                }
            }

            return message.content || 'Entendido! Como posso ajudar mais?';
        } catch (error) {
            console.error('AI Error:', error);
            return 'Desculpe, tive um problema ao processar seu pedido com IA.';
        }
    }

    return 'Não entendi sua pergunta. Tente algo como "Quanto gastei este mês?" ou "Gastei 50 reais com pizza".';
}
