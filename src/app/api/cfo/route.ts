export const runtime = "nodejs";
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { generateInsights } from '@/lib/cfo-engine';

export async function GET() {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

        const insights = await generateInsights(session.familyId, session.userId);
        return NextResponse.json(insights);
    } catch (error) {
        console.error('CFO error:', error);
        return NextResponse.json({ error: 'Erro ao gerar insights' }, { status: 500 });
    }
}
