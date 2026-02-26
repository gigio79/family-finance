export const runtime = "nodejs";
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { registerTransaction } from '@/lib/transaction-service';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
    try {
        const secret = req.headers.get('x-webhook-secret');
        if (secret !== process.env.WEBHOOK_SECRET) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { content, userId } = await req.json();

        if (!content || !userId) {
            return NextResponse.json({ error: 'Missing content or userId' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { familyId: true }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // 1. Parse Email with AI
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: 'Você é um extrator de dados bancários. Receba o texto de um email de notificação de banco e extraia: descrição do gasto, valor, categoria sugerida, data (YYYY-MM-DD) e tipo (EXPENSE ou INCOME). Retorne APENAS um JSON puro.'
                },
                {
                    role: 'user',
                    content: `Texto do email: ${content}`
                }
            ],
            response_format: { type: 'json_object' }
        });

        const rawResult = completion.choices[0].message.content;
        const parsed = JSON.parse(rawResult || '{}');

        // 2. Register Transaction
        const result = await registerTransaction({
            description: parsed.description,
            amount: Number(parsed.amount),
            category: parsed.category,
            date: parsed.date,
            type: (parsed.type?.toUpperCase() === 'INCOME' ? 'INCOME' : 'EXPENSE') as 'INCOME' | 'EXPENSE',
            familyId: user.familyId,
            userId: userId,
            source: 'EMAIL'
        });

        return NextResponse.json({
            success: result.success,
            message: result.message,
            extracted: parsed
        });

    } catch (error) {
        console.error('Webhook Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
