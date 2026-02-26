import { prisma } from './prisma';
import { format, addMonths } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

export interface RegistrationResult {
    success: boolean;
    message: string;
    transactions?: any[];
}

export interface TransactionInput {
    description: string;
    amount: number;
    category: string;
    date?: string;
    type: 'INCOME' | 'EXPENSE';
    familyId: string;
    userId: string;
    source?: string;
    accountId?: string;
    isInstallment?: boolean;
    totalInstallments?: number;
    firstInstallmentDate?: string;
}

function calculateInstallmentAmount(totalAmount: number, totalInstallments: number): { perInstallment: number; remainder: number } {
    const perInstallment = Math.floor((totalAmount * 100) / totalInstallments) / 100;
    const remainder = Math.round((totalAmount - (perInstallment * totalInstallments)) * 100) / 100;
    return { perInstallment, remainder };
}

async function findOrCreateCategory(familyId: string, categoryName: string, type: string = 'EXPENSE') {
    let category = await prisma.category.findFirst({
        where: { familyId, name: { contains: categoryName }, type }
    });

    if (!category) {
        category = await prisma.category.create({
            data: { name: categoryName, type, familyId, color: '#6366f1', icon: '📦' }
        });
    }

    return category;
}

export async function registerTransaction(args: TransactionInput): Promise<RegistrationResult> {
    try {
        const now = new Date();
        
        if (args.amount <= 0) {
            return { success: false, message: 'O valor deve ser maior que zero.' };
        }

        const isInstallment = args.isInstallment && args.totalInstallments && args.totalInstallments >= 2;
        
        if (isInstallment) {
            const maxInstallments = 36;
            if (args.totalInstallments! > maxInstallments) {
                return { success: false, message: `Número máximo de parcelas é ${maxInstallments}.` };
            }

            const { perInstallment, remainder } = calculateInstallmentAmount(args.amount, args.totalInstallments!);
            const installmentGroupId = uuidv4();
            
            const firstDate = args.firstInstallmentDate ? new Date(args.firstInstallmentDate) : now;
            const category = await findOrCreateCategory(args.familyId, args.category, args.type);
            
            const createdTransactions = [];
            
            for (let i = 1; i <= args.totalInstallments!; i++) {
                const installmentAmount = i === args.totalInstallments! 
                    ? perInstallment + remainder 
                    : perInstallment;
                
                const installmentDate = addMonths(firstDate, i - 1);
                
                const tx = await prisma.transaction.create({
                    data: {
                        amount: installmentAmount,
                        description: args.description,
                        date: installmentDate,
                        type: args.type,
                        categoryId: category.id,
                        accountId: args.accountId,
                        familyId: args.familyId,
                        userId: args.userId,
                        status: 'CONFIRMED',
                        source: args.source || 'MANUAL',
                        isInstallment: true,
                        installmentGroupId,
                        installmentNumber: i,
                        totalInstallments: args.totalInstallments!,
                        parentTransactionId: i === 1 ? undefined : undefined
                    }
                });
                
                createdTransactions.push(tx);
            }

            const totalRegistered = createdTransactions.reduce((sum, tx) => sum + tx.amount, 0);
            
            return {
                success: true,
                message: `✅ **Compra Parcelada Registrada!**\n\n📝 ${args.description}\n💰 Total: R$ ${args.amount.toFixed(2)}\n📊 ${args.totalInstallments}x de R$ ${perInstallment.toFixed(2)}\n🏷️ ${category.name}\n📅 De ${format(firstDate, 'dd/MM/yyyy')} até ${format(addMonths(firstDate, args.totalInstallments! - 1), 'dd/MM/yyyy')}`,
                transactions: createdTransactions
            };
        }

        const category = await findOrCreateCategory(args.familyId, args.category, args.type);

        const tx = await prisma.transaction.create({
            data: {
                amount: args.amount,
                description: args.description,
                date: args.date ? new Date(args.date) : now,
                type: args.type,
                categoryId: category.id,
                accountId: args.accountId,
                familyId: args.familyId,
                userId: args.userId,
                status: 'CONFIRMED',
                source: args.source || 'MANUAL',
                isInstallment: false
            }
        });

        return {
            success: true,
            message: `✅ **Transação Registrada!**\n\n📝 ${tx.description}\n💰 R$ ${tx.amount.toFixed(2)}\n🏷️ ${category.name}\n📅 ${format(tx.date, 'dd/MM/yyyy')}`,
            transactions: [tx]
        };
    } catch (error) {
        console.error('Registration Error:', error);
        return { success: false, message: 'Falha ao registrar transação.' };
    }
}

export async function getInstallmentGroup(groupId: string, familyId: string) {
    return prisma.transaction.findMany({
        where: { installmentGroupId: groupId, familyId },
        orderBy: { installmentNumber: 'asc' }
    });
}

export async function cancelInstallmentGroup(groupId: string, familyId: string, fromInstallment: number) {
    return prisma.transaction.updateMany({
        where: {
            installmentGroupId: groupId,
            familyId,
            installmentNumber: { gte: fromInstallment }
        },
        data: { status: 'CANCELLED' }
    });
}

export async function updateInstallmentStatus(transactionId: string, status: string) {
    return prisma.transaction.update({
        where: { id: transactionId },
        data: { status }
    });
}
