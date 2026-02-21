import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { awardPoints, checkAndAwardMedals } from '@/lib/gamification';

export async function GET(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const type = searchParams.get('type');
        const categoryId = searchParams.get('categoryId');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const status = searchParams.get('status');

        const where: Record<string, unknown> = { familyId: session.familyId };
        if (type) where.type = type;
        if (categoryId) where.categoryId = categoryId;
        if (status) where.status = status;
        if (startDate || endDate) {
            where.date = {};
            if (startDate) (where.date as Record<string, unknown>).gte = new Date(startDate);
            if (endDate) (where.date as Record<string, unknown>).lte = new Date(endDate);
        }

        const transactions = await prisma.transaction.findMany({
            where,
            include: { category: true, user: { select: { id: true, name: true } } },
            orderBy: { date: 'desc' },
            take: 100,
        });

        return NextResponse.json(transactions);
    } catch (error) {
        console.error('Transactions GET error:', error);
        return NextResponse.json({ error: 'Erro ao buscar transações' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

        const { amount, description, date, type, categoryId, recurring, recurringInterval, status: txStatus } = await req.json();

        if (!amount || !description || !date || !type) {
            return NextResponse.json({ error: 'Campos obrigatórios: amount, description, date, type' }, { status: 400 });
        }

        const transaction = await prisma.transaction.create({
            data: {
                amount: parseFloat(amount),
                description,
                date: new Date(date),
                type,
                categoryId: categoryId || null,
                userId: session.userId,
                familyId: session.familyId,
                recurring: recurring || false,
                recurringInterval: recurringInterval || null,
                status: txStatus || 'CONFIRMED',
            },
            include: { category: true, user: { select: { id: true, name: true } } },
        });

        // Award gamification points
        const action = type === 'INCOME' ? 'REGISTER_INCOME' : 'REGISTER_EXPENSE';
        await awardPoints(session.userId, action);
        if (categoryId) await awardPoints(session.userId, 'CATEGORIZE');
        await checkAndAwardMedals(session.userId, session.familyId);

        return NextResponse.json(transaction, { status: 201 });
    } catch (error) {
        console.error('Transaction POST error:', error);
        return NextResponse.json({ error: 'Erro ao criar transação' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

        const { id, ...data } = await req.json();
        if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 });

        const existing = await prisma.transaction.findFirst({
            where: { id, familyId: session.familyId },
        });
        if (!existing) return NextResponse.json({ error: 'Transação não encontrada' }, { status: 404 });

        const updated = await prisma.transaction.update({
            where: { id },
            data: {
                ...(data.amount !== undefined && { amount: parseFloat(data.amount) }),
                ...(data.description && { description: data.description }),
                ...(data.date && { date: new Date(data.date) }),
                ...(data.type && { type: data.type }),
                ...(data.categoryId !== undefined && { categoryId: data.categoryId || null }),
                ...(data.status && { status: data.status }),
                ...(data.recurring !== undefined && { recurring: data.recurring }),
                ...(data.recurringInterval !== undefined && { recurringInterval: data.recurringInterval }),
            },
            include: { category: true, user: { select: { id: true, name: true } } },
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error('Transaction PUT error:', error);
        return NextResponse.json({ error: 'Erro ao atualizar transação' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 });

        const existing = await prisma.transaction.findFirst({
            where: { id, familyId: session.familyId },
        });
        if (!existing) return NextResponse.json({ error: 'Transação não encontrada' }, { status: 404 });

        await prisma.transaction.delete({ where: { id } });
        return NextResponse.json({ message: 'Transação removida' });
    } catch (error) {
        console.error('Transaction DELETE error:', error);
        return NextResponse.json({ error: 'Erro ao remover transação' }, { status: 500 });
    }
}
