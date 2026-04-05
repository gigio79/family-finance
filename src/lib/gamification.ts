import { prisma } from './prisma';

export interface PointAction {
    action: string;
    points: number;
}

export const POINT_ACTIONS: Record<string, PointAction> = {
    REGISTER_EXPENSE: { action: 'Registrar gasto', points: 10 },
    REGISTER_INCOME: { action: 'Registrar receita', points: 10 },
    MEET_GOAL: { action: 'Cumprir meta', points: 20 },
    DAILY_LOGIN: { action: 'Login diário', points: 5 },
    CATEGORIZE: { action: 'Categorizar gasto', points: 5 },
    BUDGET_WITHIN: { action: 'Manter orçamento', points: 15 },
};

export const MEDALS = {
    ECONOMIST: {
        type: 'ECONOMIST',
        name: 'Economista',
        icon: '🏆',
        description: 'Ficou dentro do orçamento o mês todo',
    },
    CONSISTENT: {
        type: 'CONSISTENT',
        name: 'Consistente',
        icon: '🔥',
        description: 'Manteve uma sequência de 7 dias registrando',
    },
    MASTER: {
        type: 'MASTER',
        name: 'Mestre Financeiro',
        icon: '👑',
        description: 'Cumpriu todas as metas mensais',
    },
    RECORDER: {
        type: 'RECORDER',
        name: 'Registrador',
        icon: '📝',
        description: 'Registrou mais de 50 transações',
    },
    SAVER: {
        type: 'SAVER',
        name: 'Poupador',
        icon: '💎',
        description: 'Poupou mais de 30% da renda',
    },
};

export async function awardPoints(userId: string, action: keyof typeof POINT_ACTIONS): Promise<number> {
    const points = POINT_ACTIONS[action].points;
    await prisma.user.update({
        where: { id: userId },
        data: { points: { increment: points } },
    });
    return points;
}

export async function checkAndAwardMedals(userId: string, familyId: string): Promise<string[]> {
    const awarded: string[] = [];
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return awarded;

    const existingAchievements = await prisma.achievement.findMany({
        where: { userId },
    });
    const existingTypes = new Set(existingAchievements.map(a => a.type));

    // Check RECORDER medal (50+ transactions)
    if (!existingTypes.has('RECORDER')) {
        const txCount = await prisma.transaction.count({ where: { userId } });
        if (txCount >= 50) {
            await prisma.achievement.create({
                data: {
                    type: 'RECORDER',
                    name: MEDALS.RECORDER.name,
                    icon: MEDALS.RECORDER.icon,
                    userId,
                    familyId,
                },
            });
            awarded.push('RECORDER');
        }
    }

    // Check CONSISTENT medal (7-day streak)
    if (!existingTypes.has('CONSISTENT') && user.streak >= 7) {
        await prisma.achievement.create({
            data: {
                type: 'CONSISTENT',
                name: MEDALS.CONSISTENT.name,
                icon: MEDALS.CONSISTENT.icon,
                userId,
                familyId,
            },
        });
        awarded.push('CONSISTENT');
    }

    return awarded;
}

export async function updateStreak(userId: string): Promise<number> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return 0;

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    let newStreak = 1;
    if (user.lastLoginDate === yesterday) {
        newStreak = user.streak + 1;
    } else if (user.lastLoginDate === today) {
        newStreak = user.streak;
    }

    await prisma.user.update({
        where: { id: userId },
        data: { streak: newStreak, lastLoginDate: today },
    });

    return newStreak;
}

export async function getFamilyRanking(familyId: string) {
    const users = await prisma.user.findMany({
        where: { familyId },
        orderBy: { points: 'desc' },
        select: {
            id: true,
            name: true,
            points: true,
            streak: true,
            achievements: true,
        },
    });
    return users;
}
