import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { startOfMonth, endOfMonth, parseISO, format } from 'date-fns';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

        const { id } = await params;
        const { searchParams } = new URL(req.url);
        const monthParam = searchParams.get('month');

        const account = await prisma.account.findFirst({
            where: { id, familyId: session.familyId }
        });

        if (!account) return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });

        if (account.type !== 'CREDIT_CARD') {
            return NextResponse.json({ error: 'Esta não é uma conta de cartão de crédito' }, { status: 400 });
        }

        let monthDate: Date;
        if (monthParam) {
            monthDate = parseISO(monthParam + '-01');
        } else {
            monthDate = new Date();
        }

        const monthStart = startOfMonth(monthDate);
        const monthEnd = endOfMonth(monthDate);

        const transactions = await prisma.transaction.findMany({
            where: {
                accountId: id,
                billingMonth: { gte: monthStart, lte: monthEnd },
                type: 'EXPENSE'
            },
            include: {
                category: true,
                user: { select: { id: true, name: true } }
            },
            orderBy: { date: 'desc' }
        });

        const totalBill = transactions.reduce((sum, tx) => sum + tx.amount, 0);
        const paidTransactions = transactions.filter(tx => tx.status === 'CONFIRMED');
        const pendingTransactions = transactions.filter(tx => tx.status === 'PENDING');

        const dueDate = new Date(monthDate.getFullYear(), monthDate.getMonth(), account.dueDay || 10);
        const isOverdue = dueDate < new Date() && pendingTransactions.length > 0;

        return NextResponse.json({
            account: {
                id: account.id,
                name: account.name,
                limit: account.limit,
                closingDay: account.closingDay,
                dueDay: account.dueDay,
                color: account.color,
                icon: account.icon
            },
            billingMonth: format(monthDate, 'yyyy-MM'),
            billingMonthLabel: format(monthDate, 'MMMM yyyy', { locale: require('date-fns/locale/pt-BR') }),
            dueDate: format(dueDate, 'dd/MM/yyyy'),
            isOverdue,
            totalBill,
            totalPaid: paidTransactions.reduce((sum, tx) => sum + tx.amount, 0),
            totalPending: pendingTransactions.reduce((sum, tx) => sum + tx.amount, 0),
            transactionCount: transactions.length,
            transactions
        });
    } catch (error) {
        console.error('Bill GET error:', error);
        return NextResponse.json({ error: 'Erro ao buscar fatura' }, { status: 500 });
    }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

        const { id } = await params;
        const { month, accountId, amount } = await req.json();

        const account = await prisma.account.findFirst({
            where: { id, familyId: session.familyId }
        });

        if (!account) return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });

        if (account.type !== 'CREDIT_CARD') {
            return NextResponse.json({ error: 'Esta não é uma conta de cartão de crédito' }, { status: 400 });
        }

        let monthDate: Date;
        if (month) {
            monthDate = parseISO(month + '-01');
        } else {
            monthDate = new Date();
        }

        const monthStart = startOfMonth(monthDate);
        const monthEnd = endOfMonth(monthDate);

        const unpaidTransactions = await prisma.transaction.findMany({
            where: {
                accountId: id,
                type: 'EXPENSE',
                billingMonth: { gte: monthStart, lte: monthEnd },
                status: 'PENDING'
            }
        });

        const totalAmount = unpaidTransactions.reduce((sum, tx) => sum + tx.amount, 0);

        await prisma.transaction.updateMany({
            where: {
                id: { in: unpaidTransactions.map(tx => tx.id) }
            },
            data: { status: 'CONFIRMED' }
        });

        if (accountId && totalAmount > 0) {
            await prisma.transaction.create({
                data: {
                    amount: totalAmount,
                    description: `Pagamento fatura ${account.name} - ${format(monthDate, 'MM/yyyy')}`,
                    date: new Date(),
                    type: 'EXPENSE',
                    categoryId: undefined,
                    accountId: accountId || undefined,
                    userId: session.userId,
                    familyId: session.familyId,
                    status: 'CONFIRMED',
                    source: 'MANUAL'
                }
            });
        }

        return NextResponse.json({
            success: true,
            message: `Fatura paga! Total: R$ ${totalAmount.toFixed(2)}`,
            paidAmount: totalAmount,
            transactionsPaid: unpaidTransactions.length
        });
    } catch (error) {
        console.error('Bill POST error:', error);
        return NextResponse.json({ error: 'Erro ao pagar fatura' }, { status: 500 });
    }
}
