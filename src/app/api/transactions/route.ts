export const runtime = "nodejs";
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { awardPoints, checkAndAwardMedals } from '@/lib/gamification';
import { registerTransaction, getInstallmentGroup, cancelInstallmentGroup } from '@/lib/transaction-service';
import { addMonths, startOfMonth } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

function calculateBillingMonth(transactionDate: Date, closingDay: number): Date {
    const day = transactionDate.getDate();
    if (day <= closingDay) {
        return startOfMonth(transactionDate);
    } else {
        return startOfMonth(addMonths(transactionDate, 1));
    }
}

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
        const installmentGroupId = searchParams.get('installmentGroupId');

        if (installmentGroupId) {
            const installments = await prisma.transaction.findMany({
                where: { installmentGroupId, familyId: session.familyId },
                orderBy: { installmentNumber: 'asc' },
                include: { category: true, user: { select: { id: true, name: true } } }
            });
            return NextResponse.json(installments);
        }

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
            include: { category: true, user: { select: { id: true, name: true } }, account: true },
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

        const { 
            amount, description, date, type, categoryId, 
            recurring, recurringInterval, status: txStatus,
            accountId,
            isInstallment, totalInstallments, firstInstallmentDate
        } = await req.json();

        if (!amount || !description || !date || !type) {
            return NextResponse.json({ error: 'Campos obrigatórios: amount, description, date, type' }, { status: 400 });
        }

        const amountNum = parseFloat(amount);
        
        if (amountNum <= 0) {
            return NextResponse.json({ error: 'O valor deve ser maior que zero' }, { status: 400 });
        }

        const isInstallmentPurchase = isInstallment && totalInstallments && totalInstallments >= 2;
        
        let accountData: { accountId?: string; billingMonth?: Date } = {};
        
        if (accountId && type === 'EXPENSE') {
            const account = await prisma.account.findUnique({ where: { id: accountId } });
            if (account && account.type === 'CREDIT_CARD' && account.closingDay) {
                const txDate = new Date(date);
                accountData = {
                    accountId,
                    billingMonth: calculateBillingMonth(txDate, account.closingDay)
                };
            }
        }
        
        if (isInstallmentPurchase) {
            const maxInstallments = 36;
            if (totalInstallments > maxInstallments) {
                return NextResponse.json({ error: `Número máximo de parcelas é ${maxInstallments}` }, { status: 400 });
            }

            const perInstallment = Math.floor((amountNum * 100) / totalInstallments) / 100;
            const remainder = Math.round((amountNum - (perInstallment * totalInstallments)) * 100) / 100;
            const installmentGroupId = uuidv4();
            
            const firstDate = firstInstallmentDate ? new Date(firstInstallmentDate) : new Date(date);
            const category = categoryId || await prisma.category.findFirst({ where: { familyId: session.familyId } });
            
            const createdTransactions = [];
            
            let installmentAccountId = accountId;
            let accountClosingDay = 25;
            
            if (accountId) {
                const account = await prisma.account.findUnique({ where: { id: accountId } });
                if (account && account.type === 'CREDIT_CARD') {
                    accountClosingDay = account.closingDay || 25;
                }
            }
            
            for (let i = 1; i <= totalInstallments; i++) {
                const installmentAmount = i === totalInstallments 
                    ? perInstallment + remainder 
                    : perInstallment;
                
                const installmentDate = addMonths(firstDate, i - 1);
                const installmentBillingMonth = calculateBillingMonth(installmentDate, accountClosingDay);
                
                const tx = await prisma.transaction.create({
                    data: {
                        amount: installmentAmount,
                        description: `${description} (${i}/${totalInstallments})`,
                        date: installmentDate,
                        type,
                        categoryId: category?.id || null,
                        accountId: installmentAccountId || null,
                        userId: session.userId,
                        familyId: session.familyId,
                        recurring: false,
                        recurringInterval: null,
                        status: txStatus || 'CONFIRMED',
                        source: 'MANUAL',
                        isInstallment: true,
                        installmentGroupId,
                        installmentNumber: i,
                        totalInstallments,
                        ...(installmentAccountId && { billingMonth: installmentBillingMonth })
                    },
                    include: { category: true, user: { select: { id: true, name: true } } }
                });
                
                createdTransactions.push(tx);
            }

            await awardPoints(session.userId, type === 'INCOME' ? 'REGISTER_INCOME' : 'REGISTER_EXPENSE');
            await checkAndAwardMedals(session.userId, session.familyId);

            return NextResponse.json({
                message: `Compra parcelada criada: ${totalInstallments}x de R$ ${perInstallment.toFixed(2)}`,
                transactions: createdTransactions,
                installmentGroupId
            }, { status: 201 });
        }

        const transaction = await prisma.transaction.create({
            data: {
                amount: amountNum,
                description,
                date: new Date(date),
                type,
                categoryId: categoryId || null,
                accountId: accountId || null,
                userId: session.userId,
                familyId: session.familyId,
                recurring: recurring || false,
                recurringInterval: recurringInterval || null,
                status: txStatus || 'CONFIRMED',
                isInstallment: false,
                ...accountData
            },
            include: { category: true, user: { select: { id: true, name: true } } }
        });

        await awardPoints(session.userId, type === 'INCOME' ? 'REGISTER_INCOME' : 'REGISTER_EXPENSE');
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

        if (existing.isInstallment && existing.installmentGroupId) {
            if (existing.date > new Date()) {
                await prisma.transaction.updateMany({
                    where: { installmentGroupId: existing.installmentGroupId, familyId: session.familyId },
                    data: {
                        ...(data.amount !== undefined && { amount: parseFloat(data.amount) }),
                        ...(data.description && { description: data.description }),
                        ...(data.categoryId !== undefined && { categoryId: data.categoryId || null }),
                    }
                });
            }
            
            const updated = await prisma.transaction.update({
                where: { id },
                data: {
                    ...(data.amount !== undefined && { amount: parseFloat(data.amount) }),
                    ...(data.description && { description: data.description }),
                    ...(data.date && { date: new Date(data.date) }),
                    ...(data.type && { type: data.type }),
                    ...(data.categoryId !== undefined && { categoryId: data.categoryId || null }),
                    ...(data.status && { status: data.status }),
                },
                include: { category: true, user: { select: { id: true, name: true } } }
            });
            return NextResponse.json(updated);
        }

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
            include: { category: true, user: { select: { id: true, name: true } } }
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
        const installmentGroupId = searchParams.get('installmentGroupId');
        const cancelFrom = searchParams.get('cancelFrom');
        
        if (!id && !installmentGroupId) return NextResponse.json({ error: 'ID ou installmentGroupId obrigatório' }, { status: 400 });

        if (installmentGroupId) {
            const fromInstallment = cancelFrom ? parseInt(cancelFrom) : 1;
            await prisma.transaction.updateMany({
                where: { 
                    installmentGroupId, 
                    familyId: session.familyId,
                    installmentNumber: { gte: fromInstallment }
                },
                data: { status: 'CANCELLED' }
            });
            return NextResponse.json({ message: 'Parcelas canceladas' });
        }

        if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 });

        const existing = await prisma.transaction.findFirst({
            where: { id, familyId: session.familyId },
        });
        if (!existing) return NextResponse.json({ error: 'Transação não encontrada' }, { status: 404 });

        if (existing.isInstallment && existing.installmentGroupId) {
            await prisma.transaction.updateMany({
                where: { 
                    installmentGroupId: existing.installmentGroupId,
                    familyId: session.familyId
                },
                data: { status: 'CANCELLED' }
            });
        } else {
            await prisma.transaction.delete({ where: { id } });
        }
        
        return NextResponse.json({ message: 'Transação removida' });
    } catch (error) {
        console.error('Transaction DELETE error:', error);
        return NextResponse.json({ error: 'Erro ao remover transação' }, { status: 500 });
    }
}
