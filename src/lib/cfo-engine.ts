import { prisma } from './prisma';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface CFOInsight {
    id: string;
    type: 'warning' | 'success' | 'info' | 'danger';
    icon: string;
    title: string;
    message: string;
    value?: number;
    percentage?: number;
}

export async function generateInsights(familyId: string, userId: string): Promise<CFOInsight[]> {
    const insights: CFOInsight[] = [];
    const now = new Date();
    // ... (rest of the logic remains same until AI section)
    const currentMonthStart = startOfMonth(now);
    const currentMonthEnd = endOfMonth(now);
    const prevMonthStart = startOfMonth(subMonths(now, 1));
    const prevMonthEnd = endOfMonth(subMonths(now, 1));

    // Get current month transactions
    const currentTransactions = await prisma.transaction.findMany({
        where: {
            familyId,
            date: { gte: currentMonthStart, lte: currentMonthEnd },
            status: 'CONFIRMED',
        },
        include: { category: true },
    });

    // Get previous month transactions
    const prevTransactions = await prisma.transaction.findMany({
        where: {
            familyId,
            date: { gte: prevMonthStart, lte: prevMonthEnd },
            status: 'CONFIRMED',
        },
        include: { category: true },
    });

    const currentExpenses = currentTransactions.filter(t => t.type === 'EXPENSE');
    const prevExpenses = prevTransactions.filter(t => t.type === 'EXPENSE');
    const currentIncome = currentTransactions.filter(t => t.type === 'INCOME');
    const prevIncome = prevTransactions.filter(t => t.type === 'INCOME');

    const totalCurrentExpenses = currentExpenses.reduce((s, t) => s + t.amount, 0);
    const totalPrevExpenses = prevExpenses.reduce((s, t) => s + t.amount, 0);
    const totalCurrentIncome = currentIncome.reduce((s, t) => s + t.amount, 0);
    const totalPrevIncome = prevIncome.reduce((s, t) => s + t.amount, 0);

    // 1. Overall spending comparison
    if (totalPrevExpenses > 0) {
        const change = ((totalCurrentExpenses - totalPrevExpenses) / totalPrevExpenses) * 100;
        if (change > 15) {
            insights.push({
                id: 'spending-increase',
                type: 'danger',
                icon: '📈',
                title: 'Gastos em Alta',
                message: `Seus gastos aumentaram ${change.toFixed(0)}% em relação ao mês passado. Atenção!`,
                percentage: change,
            });
        } else if (change < -10) {
            insights.push({
                id: 'spending-decrease',
                type: 'success',
                icon: '📉',
                title: 'Economia Detectada!',
                message: `Parabéns! Seus gastos diminuíram ${Math.abs(change).toFixed(0)}% em relação ao mês passado.`,
                percentage: change,
            });
        }
    }

    // 2. Balance projection
    const balance = totalCurrentIncome - totalCurrentExpenses;
    const daysInMonth = endOfMonth(now).getDate();
    const currentDay = now.getDate();
    const dailyBurn = totalCurrentExpenses / Math.max(currentDay, 1);
    const projectedExpenses = dailyBurn * daysInMonth;
    const projectedBalance = totalCurrentIncome - projectedExpenses;

    // Only show projection if we have enough data (at least 3 transactions or 5+ days in month)
    const hasEnoughData = currentTransactions.length >= 3 || currentDay >= 5;

    if (!hasEnoughData) {
        insights.push({
            id: 'collecting-data',
            type: 'info',
            icon: '📊',
            title: 'Coletando Dados',
            message: 'Precisamos de mais transações para gerar uma previsão precisa. Continue registrando seus gastos!',
        });
    } else if (projectedBalance < 0) {
        insights.push({
            id: 'negative-projection',
            type: 'warning',
            icon: '⚠️',
            title: 'Projeção Negativa',
            message: `Se o ritmo atual de gastos continuar, você terminará o mês com um déficit de R$ ${Math.abs(projectedBalance).toFixed(2)}.`,
            value: projectedBalance,
        });
    } else {
        insights.push({
            id: 'positive-projection',
            type: 'info',
            icon: '💰',
            title: 'Projeção do Mês',
            message: `Projeção de sobra de R$ ${projectedBalance.toFixed(2)} até o final do mês.`,
            value: projectedBalance,
        });
    }

    // 3. Category spending spikes
    const categoryExpenses: Record<string, { current: number; previous: number; name: string }> = {};

    currentExpenses.forEach(t => {
        const catName = t.category?.name || 'Sem Categoria';
        if (!categoryExpenses[catName]) categoryExpenses[catName] = { current: 0, previous: 0, name: catName };
        categoryExpenses[catName].current += t.amount;
    });

    prevExpenses.forEach(t => {
        const catName = t.category?.name || 'Sem Categoria';
        if (!categoryExpenses[catName]) categoryExpenses[catName] = { current: 0, previous: 0, name: catName };
        categoryExpenses[catName].previous += t.amount;
    });

    Object.values(categoryExpenses).forEach(cat => {
        if (cat.previous > 0) {
            const change = ((cat.current - cat.previous) / cat.previous) * 100;
            if (change > 20) {
                insights.push({
                    id: `category-spike-${cat.name}`,
                    type: 'warning',
                    icon: '🔥',
                    title: `${cat.name} em Alta`,
                    message: `Seus gastos com ${cat.name} aumentaram ${change.toFixed(0)}% este mês.`,
                    percentage: change,
                });
            }
        }
    });

    // 4. Budget warnings
    const budgets = await prisma.budget.findMany({
        where: {
            familyId,
            month: format(now, 'yyyy-MM'),
        },
        include: { category: true },
    });

    for (const budget of budgets) {
        const spent = currentExpenses
            .filter(t => t.categoryId === budget.categoryId)
            .reduce((s, t) => s + t.amount, 0);
        const percentage = (spent / budget.limit) * 100;

        if (percentage >= 90) {
            insights.push({
                id: `budget-alert-${budget.categoryId}`,
                type: 'danger',
                icon: '🚨',
                title: `Orçamento ${budget.category.name}`,
                message: `Você já usou ${percentage.toFixed(0)}% do orçamento de ${budget.category.name} (R$ ${spent.toFixed(2)} de R$ ${budget.limit.toFixed(2)}).`,
                percentage,
            });
        } else if (percentage >= 70) {
            insights.push({
                id: `budget-warn-${budget.categoryId}`,
                type: 'warning',
                icon: '⚡',
                title: `Orçamento ${budget.category.name}`,
                message: `${percentage.toFixed(0)}% do orçamento de ${budget.category.name} já foi utilizado.`,
                percentage,
            });
        }
    }

    // 5. Income trend
    if (totalPrevIncome > 0 && totalCurrentIncome > totalPrevIncome * 1.1) {
        insights.push({
            id: 'income-increase',
            type: 'success',
            icon: '🎉',
            title: 'Receita Crescendo',
            message: `Sua receita aumentou ${(((totalCurrentIncome - totalPrevIncome) / totalPrevIncome) * 100).toFixed(0)}%!`,
        });
    }

    // 6. Savings rate
    if (totalCurrentIncome > 0) {
        const savingsRate = ((totalCurrentIncome - totalCurrentExpenses) / totalCurrentIncome) * 100;
        if (savingsRate > 20) {
            insights.push({
                id: 'savings-rate',
                type: 'success',
                icon: '🏆',
                title: 'Taxa de Poupança',
                message: `Excelente! Você está poupando ${savingsRate.toFixed(0)}% da sua renda este mês.`,
                percentage: savingsRate,
            });
        } else if (savingsRate < 5 && savingsRate > 0) {
            insights.push({
                id: 'low-savings',
                type: 'warning',
                icon: '💡',
                title: 'Margem Apertada',
                message: `Sua taxa de poupança é de apenas ${savingsRate.toFixed(0)}%. Tente reduzir despesas não essenciais.`,
                percentage: savingsRate,
            });
        }
    }

    // 7. AI Final Commentary (Optional based on API Key presence)
    if (process.env.OPENAI_API_KEY && insights.length > 0) {
        try {
            const { logAiUsage, checkMonthlyLimit } = await import('./ai-usage');
            const { allowed } = await checkMonthlyLimit(familyId);

            if (allowed) {
                const OpenAI = (await import('openai')).default;
                const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

                const summary = insights.map(i => `${i.title}: ${i.message}`).join('. ');
                const completion = await openai.chat.completions.create({
                    model: 'gpt-3.5-turbo',
                    messages: [
                        {
                            role: 'system',
                            content: 'Você é um CFO experiente. Resuma os insights financeiros da família em um parágrafo curto, motivacional e estratégico em português.'
                        },
                        { role: 'user', content: `Aqui estão os principais pontos do mês: ${summary}` }
                    ],
                    max_tokens: 150,
                });

                // Log AI usage
                await logAiUsage({
                    familyId,
                    userId,
                    actionType: 'CFO_INSIGHTS',
                    tokensInput: completion.usage?.prompt_tokens || 0,
                    tokensOutput: completion.usage?.completion_tokens || 0
                });

                const commentary = completion.choices[0].message.content;
                if (commentary) {
                    insights.push({
                        id: 'ai-cfo-advice',
                        type: 'info',
                        icon: '🧠',
                        title: 'Reflexão do CFO IA',
                        message: commentary,
                    });
                }
            } else {
                insights.push({
                    id: 'ai-limit-reached',
                    type: 'warning',
                    icon: '⚠️',
                    title: 'CFO IA Offline',
                    message: 'O limite mensal de uso da inteligência artificial foi atingido para sua família.',
                });
            }
        } catch (e) {
            console.error('AI Insight Error:', e);
        }
    }

    return insights;
}
