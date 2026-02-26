import { prisma } from './prisma';
import { startOfMonth, endOfMonth } from 'date-fns';

const MONTHLY_TOKENS_LIMIT = 500000; // Example limit: 500k tokens per family/month
const COST_PER_1K_INPUT = 0.00015; // GPT-4o-mini approx
const COST_PER_1K_OUTPUT = 0.0006;

export interface AiLogData {
    familyId: string;
    userId: string;
    actionType: string;
    tokensInput: number;
    tokensOutput: number;
}

export async function logAiUsage(data: AiLogData) {
    try {
        const estimatedCost = (data.tokensInput / 1000 * COST_PER_1K_INPUT) +
            (data.tokensOutput / 1000 * COST_PER_1K_OUTPUT);

        await prisma.aiUsageLog.create({
            data: {
                ...data,
                estimatedCost
            }
        });
    } catch (error) {
        console.error('Failed to log AI usage:', error);
    }
}

export async function checkMonthlyLimit(familyId: string): Promise<{ allowed: boolean; used: number }> {
    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);

    const logs = await prisma.aiUsageLog.findMany({
        where: {
            familyId,
            createdAt: { gte: start, lte: end }
        }
    });

    const totalTokens = logs.reduce((sum: number, log: any) => sum + log.tokensInput + log.tokensOutput, 0);

    return {
        allowed: totalTokens < MONTHLY_TOKENS_LIMIT,
        used: totalTokens
    };
}
