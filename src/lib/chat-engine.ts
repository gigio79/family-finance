import { prisma } from './prisma';
import { startOfMonth, endOfMonth, format } from 'date-fns';

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

export async function processChat(content: string, familyId: string): Promise<string> {
    const normalized = content.trim().toLowerCase().replace(/[?!.]/g, '');

    for (const pattern of patterns) {
        const match = normalized.match(pattern.regex);
        if (match) {
            const result = await pattern.handler(match, familyId);
            return result.message;
        }
    }

    // Default responses
    const greetings = ['oi', 'olá', 'ola', 'bom dia', 'boa tarde', 'boa noite', 'hey', 'hi'];
    if (greetings.some(g => normalized.startsWith(g))) {
        return '👋 Olá! Sou o assistente financeiro da sua família. Pergunte-me sobre gastos, saldo, resumo do mês, ou qual a maior despesa!';
    }

    const helpKeywords = ['ajuda', 'help', 'o que voc[eê] faz', 'comandos'];
    if (helpKeywords.some(k => normalized.includes(k))) {
        return `🤖 **O que posso fazer:**\n\n• "Quanto gastamos com [categoria] este mês?"\n• "Qual a maior despesa?"\n• "Saldo atual"\n• "Quantas transações este mês?"\n• "Resumo do mês"\n\nEm breve terei IA avançada para respostas mais inteligentes! 🚀`;
    }

    return `🤔 Desculpe, não entendi sua pergunta. Tente perguntar:\n\n• "Quanto gastamos com alimentação?"\n• "Qual a maior despesa?"\n• "Saldo geral"\n• "Resumo mensal"`;
}
