import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

export async function GET() {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

        const now = new Date();
        const currentStart = startOfMonth(now);
        const currentEnd = endOfMonth(now);

        // Current month transactions
        const transactions = await prisma.transaction.findMany({
            where: {
                familyId: session.familyId,
                status: 'CONFIRMED',
                date: { gte: currentStart, lte: currentEnd },
            },
            include: { category: true },
        });

        const income = transactions.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
        const expenses = transactions.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
        const balance = income - expenses;

        // Category breakdown
        const categoryBreakdown: Record<string, { name: string; total: number; color: string; icon: string }> = {};
        transactions.filter(t => t.type === 'EXPENSE').forEach(t => {
            const name = t.category?.name || 'Sem Categoria';
            if (!categoryBreakdown[name]) {
                categoryBreakdown[name] = {
                    name,
                    total: 0,
                    color: t.category?.color || '#6366f1',
                    icon: t.category?.icon || '📦',
                };
            }
            categoryBreakdown[name].total += t.amount;
        });

        // Last 6 months trend
        const monthlyTrend = [];
        for (let i = 5; i >= 0; i--) {
            const monthDate = subMonths(now, i);
            const mStart = startOfMonth(monthDate);
            const mEnd = endOfMonth(monthDate);

            const monthTx = await prisma.transaction.findMany({
                where: {
                    familyId: session.familyId,
                    status: 'CONFIRMED',
                    date: { gte: mStart, lte: mEnd },
                },
            });

            const mIncome = monthTx.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
            const mExpenses = monthTx.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);

            monthlyTrend.push({
                month: format(monthDate, 'MMM'),
                income: mIncome,
                expenses: mExpenses,
                balance: mIncome - mExpenses,
            });
        }

        // Balance projection
        const daysInMonth = currentEnd.getDate();
        const currentDay = now.getDate();
        const dailyBurn = expenses / Math.max(currentDay, 1);
        const projectedExpenses = dailyBurn * daysInMonth;
        const projectedBalance = income - projectedExpenses;

        // Pending transactions count
        const pendingCount = await prisma.transaction.count({
            where: { familyId: session.familyId, status: 'PENDING' },
        });

        return NextResponse.json({
            income,
            expenses,
            balance,
            categoryBreakdown: Object.values(categoryBreakdown).sort((a, b) => b.total - a.total),
            monthlyTrend,
            projectedBalance,
            pendingCount,
            transactionCount: transactions.length,
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        return NextResponse.json({ error: 'Erro ao carregar dashboard' }, { status: 500 });
    }
}
