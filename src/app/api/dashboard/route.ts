export const runtime = "nodejs";
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { startOfMonth, endOfMonth, subMonths, addMonths, format } from 'date-fns';

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
        });

        const income = transactions.filter(t => t.type === 'INCOME').reduce((s, t) => s + Number(t.amount), 0);
        const expenses = transactions.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + Number(t.amount), 0);
        const balance = income - expenses;

        // Category breakdown - get category info separately
        const categoryBreakdown: Record<string, { name: string; total: number; color: string; icon: string }> = {};
        const categoryIds = [...new Set(transactions.filter(t => t.type === 'EXPENSE' && t.categoryId).map(t => t.categoryId))];
        
        if (categoryIds.length > 0) {
            const categories = await prisma.category.findMany({
                where: { id: { in: categoryIds as string[] } }
            });
            const categoryMap = new Map(categories.map(c => [c.id, c]));
            
            transactions.filter(t => t.type === 'EXPENSE').forEach(t => {
                const category = t.categoryId ? categoryMap.get(t.categoryId) : null;
                const name = category?.name || 'Sem Categoria';
                if (!categoryBreakdown[name]) {
                    categoryBreakdown[name] = {
                        name,
                        total: 0,
                        color: category?.color || '#6366f1',
                        icon: category?.icon || '📦',
                    };
                }
                categoryBreakdown[name].total += Number(t.amount);
            });
        }

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

            const mIncome = monthTx.filter(t => t.type === 'INCOME').reduce((s, t) => s + Number(t.amount), 0);
            const mExpenses = monthTx.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + Number(t.amount), 0);

            monthlyTrend.push({
                month: format(monthDate, 'MMM'),
                income: mIncome,
                expenses: mExpenses,
                balance: mIncome - mExpenses,
            });
        }

        // Future installments (next 6 months)
        const futureInstallments = [];
        for (let i = 1; i <= 6; i++) {
            const monthDate = addMonths(now, i);
            const mStart = startOfMonth(monthDate);
            const mEnd = endOfMonth(monthDate);

            const futureTx = await prisma.transaction.findMany({
                where: {
                    familyId: session.familyId,
                    status: 'CONFIRMED',
                    isInstallment: true,
                    date: { gte: mStart, lte: mEnd },
                },
            });

            const futureExpenses = futureTx.reduce((s, t) => s + Number(t.amount), 0);
            if (futureExpenses > 0) {
                futureInstallments.push({
                    month: format(monthDate, 'MMM/yyyy'),
                    amount: futureExpenses,
                });
            }
        }

        // Balance projection
        const daysInMonth = currentEnd.getDate();
        const currentDay = now.getDate();
        const dailyBurn = expenses / Math.max(currentDay, 1);
        const projectedExpenses = dailyBurn * daysInMonth;
        const projectedBalance = income - projectedExpenses;

        // Current month installment total
        const currentMonthInstallments = transactions
            .filter(t => t.isInstallment && t.type === 'EXPENSE')
            .reduce((s, t) => s + Number(t.amount), 0);

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
            futureInstallments,
            currentMonthInstallments,
            pendingCount,
            transactionCount: transactions.length,
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        return NextResponse.json({ error: 'Erro ao carregar dashboard' }, { status: 500 });
    }
}
