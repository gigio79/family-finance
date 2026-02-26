export const runtime = "nodejs";
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { startOfMonth, endOfMonth } from 'date-fns';

export async function GET() {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

        const accounts = await prisma.account.findMany({
            where: { familyId: session.familyId },
            orderBy: { createdAt: 'desc' }
        });

        const accountsWithCreditCardInfo = await Promise.all(accounts.map(async (account) => {
            if (account.type === 'CREDIT_CARD' && account.limit && account.closingDay) {
                const now = new Date();
                const currentMonthStart = startOfMonth(now);
                const currentMonthEnd = endOfMonth(now);

                const currentBill = await prisma.transaction.aggregate({
                    where: {
                        accountId: account.id,
                        type: 'EXPENSE',
                        billingMonth: { gte: currentMonthStart, lte: currentMonthEnd },
                        status: 'CONFIRMED'
                    },
                    _sum: { amount: true }
                });

                const usedLimit = currentBill._sum.amount || 0;
                const availableLimit = account.limit - usedLimit;

                return {
                    ...account,
                    usedLimit,
                    availableLimit,
                    utilizationPercent: (usedLimit / account.limit) * 100
                };
            }
            return account;
        }));

        return NextResponse.json(accountsWithCreditCardInfo);
    } catch (error) {
        console.error('Accounts GET error:', error);
        return NextResponse.json({ error: 'Erro ao buscar contas' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

        const { name, type, limit, closingDay, dueDay, color, icon, balance } = await req.json();

        if (!name || !type) {
            return NextResponse.json({ error: 'Campos obrigatórios: name, type' }, { status: 400 });
        }

        if (!['CASH', 'BANK', 'CREDIT_CARD'].includes(type)) {
            return NextResponse.json({ error: 'Tipo deve ser CASH, BANK ou CREDIT_CARD' }, { status: 400 });
        }

        if (type === 'CREDIT_CARD') {
            if (!limit || !closingDay || !dueDay) {
                return NextResponse.json({ error: 'Para cartões de crédito: limit, closingDay e dueDay são obrigatórios' }, { status: 400 });
            }

            if (closingDay < 1 || closingDay > 31 || dueDay < 1 || dueDay > 31) {
                return NextResponse.json({ error: 'Dia de fechamento e vencimento devem ser entre 1 e 31' }, { status: 400 });
            }

            if (limit <= 0) {
                return NextResponse.json({ error: 'Limite deve ser maior que zero' }, { status: 400 });
            }
        }

        const account = await prisma.account.create({
            data: {
                name,
                type,
                limit: type === 'CREDIT_CARD' ? parseFloat(limit) : null,
                closingDay: type === 'CREDIT_CARD' ? parseInt(closingDay) : null,
                dueDay: type === 'CREDIT_CARD' ? parseInt(dueDay) : null,
                color: color || '#6366f1',
                icon: icon || (type === 'CREDIT_CARD' ? '💳' : type === 'BANK' ? '🏦' : '💵'),
                balance: balance ? parseFloat(balance) : 0,
                familyId: session.familyId
            }
        });

        return NextResponse.json(account, { status: 201 });
    } catch (error) {
        console.error('Accounts POST error:', error);
        return NextResponse.json({ error: 'Erro ao criar conta' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

        const { id, name, type, limit, closingDay, dueDay, color, icon, balance } = await req.json();

        if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 });

        const existing = await prisma.account.findFirst({
            where: { id, familyId: session.familyId }
        });

        if (!existing) return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });

        const updated = await prisma.account.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(type && { type }),
                ...(limit !== undefined && { limit: limit ? parseFloat(limit) : null }),
                ...(closingDay !== undefined && { closingDay: closingDay ? parseInt(closingDay) : null }),
                ...(dueDay !== undefined && { dueDay: dueDay ? parseInt(dueDay) : null }),
                ...(color && { color }),
                ...(icon && { icon }),
                ...(balance !== undefined && { balance: parseFloat(balance) })
            }
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error('Accounts PUT error:', error);
        return NextResponse.json({ error: 'Erro ao atualizar conta' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 });

        const existing = await prisma.account.findFirst({
            where: { id, familyId: session.familyId }
        });

        if (!existing) return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });

        await prisma.account.delete({ where: { id } });

        return NextResponse.json({ message: 'Conta removida' });
    } catch (error) {
        console.error('Accounts DELETE error:', error);
        return NextResponse.json({ error: 'Erro ao remover conta' }, { status: 500 });
    }
}
