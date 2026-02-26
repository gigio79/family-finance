export const runtime = "nodejs";
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

        const categories = await prisma.category.findMany({
            where: { familyId: session.familyId },
            orderBy: { name: 'asc' },
        });

        return NextResponse.json(categories);
    } catch (error) {
        return NextResponse.json({ error: 'Erro ao buscar categorias' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        if (session.role !== 'ADMIN') return NextResponse.json({ error: 'Apenas administradores' }, { status: 403 });

        const { name, icon, color, rules, type } = await req.json();
        if (!name) return NextResponse.json({ error: 'Nome obrigatório' }, { status: 400 });

        try {
            const category = await prisma.category.create({
                data: {
                    name,
                    type: type || 'EXPENSE',
                    icon: icon || '📦',
                    color: color || '#6366f1',
                    rules: JSON.stringify(rules || []),
                    familyId: session.familyId,
                },
            });

            return NextResponse.json(category, { status: 201 });
        } catch (err: any) {
            if (err?.code === 'P2002') {
                return NextResponse.json(
                    { error: 'Já existe uma categoria com esse nome para esse tipo.' },
                    { status: 400 }
                );
            }

            const message: string =
                typeof err?.message === 'string' ? err.message : 'Erro ao criar categoria';

            if (message.includes('createdAt') && message.includes('does not exist')) {
                return NextResponse.json(
                    {
                        error:
                            'Seu banco está desatualizado: falta a coluna "createdAt" na tabela Category. ' +
                            'Rode as migrações do Prisma ou adicione essa coluna manualmente.'
                    },
                    { status: 500 }
                );
            }

            console.error('Erro ao criar categoria:', err);
            return NextResponse.json({ error: 'Erro ao criar categoria' }, { status: 500 });
        }
    } catch (error: any) {
        console.error('Erro inesperado ao criar categoria:', error);
        return NextResponse.json({ error: 'Erro ao criar categoria' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

        const { id, name, icon, color, rules, type } = await req.json();
        if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 });

        const existing = await prisma.category.findFirst({
            where: { id, familyId: session.familyId }
        });
        if (!existing) return NextResponse.json({ error: 'Categoria não encontrada' }, { status: 404 });

        const updated = await prisma.category.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(type && { type }),
                ...(icon && { icon }),
                ...(color && { color }),
                ...(rules !== undefined && { rules: JSON.stringify(rules) }),
            },
        });

        return NextResponse.json(updated);
    } catch (error) {
        return NextResponse.json({ error: 'Erro ao atualizar categoria' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        if (session.role !== 'ADMIN') return NextResponse.json({ error: 'Apenas administradores' }, { status: 403 });

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 });

        const existing = await prisma.category.findFirst({
            where: { id, familyId: session.familyId }
        });
        if (!existing) return NextResponse.json({ error: 'Categoria não encontrada' }, { status: 404 });

        await prisma.transaction.updateMany({ where: { categoryId: id, familyId: session.familyId }, data: { categoryId: null } });
        await prisma.category.delete({ where: { id } });

        return NextResponse.json({ message: 'Categoria removida' });
    } catch (error) {
        return NextResponse.json({ error: 'Erro ao remover categoria' }, { status: 500 });
    }
}
