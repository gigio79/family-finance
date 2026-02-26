export const runtime = "nodejs";
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { getFamilyRanking, MEDALS } from '@/lib/gamification';

export async function GET() {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

        const ranking = await getFamilyRanking(session.familyId);

        const user = await prisma.user.findUnique({
            where: { id: session.userId },
            include: { achievements: true },
        });

        const allMedals = Object.values(MEDALS).map(medal => ({
            ...medal,
            earned: user?.achievements.some(a => a.type === medal.type) || false,
            earnedAt: user?.achievements.find(a => a.type === medal.type)?.earnedAt || null,
        }));

        return NextResponse.json({
            ranking,
            medals: allMedals,
            userPoints: user?.points || 0,
            userStreak: user?.streak || 0,
        });
    } catch (error) {
        return NextResponse.json({ error: 'Erro ao carregar gamificação' }, { status: 500 });
    }
}
