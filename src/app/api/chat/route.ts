import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { processChat } from '@/lib/chat-engine';

export async function GET() {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

        const messages = await prisma.chatMessage.findMany({
            where: { userId: session.userId },
            orderBy: { createdAt: 'asc' },
            take: 50,
        });

        return NextResponse.json(messages);
    } catch (error) {
        return NextResponse.json({ error: 'Erro ao buscar mensagens' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

        const { content } = await req.json();
        if (!content) return NextResponse.json({ error: 'Mensagem obrigatória' }, { status: 400 });

        const response = await processChat(content, session.familyId);

        const chatMessage = await prisma.chatMessage.create({
            data: {
                content,
                response,
                userId: session.userId,
                familyId: session.familyId,
            },
        });

        return NextResponse.json(chatMessage, { status: 201 });
    } catch (error) {
        console.error('Chat error:', error);
        return NextResponse.json({ error: 'Erro ao processar mensagem' }, { status: 500 });
    }
}
