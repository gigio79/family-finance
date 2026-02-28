export const runtime = "nodejs";

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function GET(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

        const family = await prisma.family.findUnique({
            where: { id: session.familyId },
            include: {
                users: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        createdAt: true
                    }
                }
            }
        });

        if (!family) return NextResponse.json({ error: 'Família não encontrada' }, { status: 404 });

        return NextResponse.json(family);
    } catch (error) {
        console.error('Family GET error:', error);
        return NextResponse.json({ error: 'Erro ao buscar família' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

        if (session.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Apenas administradores podem adicionar membros' }, { status: 403 });
        }

        const { name, email, password, role } = await req.json();

        if (!name || !email || !password) {
            return NextResponse.json({ error: 'Nome, email e senha são obrigatórios' }, { status: 400 });
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return NextResponse.json({ error: 'Email já está em uso' }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: role || 'MEMBER',
                familyId: session.familyId
            }
        });

        return NextResponse.json({
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role
        }, { status: 201 });
    } catch (error) {
        console.error('Family POST error:', error);
        return NextResponse.json({ error: 'Erro ao adicionar membro' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

        if (session.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Apenas administradores podem alterar membros' }, { status: 403 });
        }

        const { userId, name, role } = await req.json();

        if (!userId) return NextResponse.json({ error: 'ID do usuário obrigatório' }, { status: 400 });

        const targetUser = await prisma.user.findFirst({
            where: { id: userId, familyId: session.familyId }
        });

        if (!targetUser) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });

        if (targetUser.id === session.userId) {
            return NextResponse.json({ error: 'Você não pode alterar seu próprio cargo' }, { status: 400 });
        }

        const updated = await prisma.user.update({
            where: { id: userId },
            data: {
                ...(name && { name }),
                ...(role && { role })
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true
            }
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error('Family PUT error:', error);
        return NextResponse.json({ error: 'Erro ao atualizar membro' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

        if (session.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Apenas administradores podem remover membros' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');

        if (!userId) return NextResponse.json({ error: 'ID do usuário obrigatório' }, { status: 400 });

        const targetUser = await prisma.user.findFirst({
            where: { id: userId, familyId: session.familyId }
        });

        if (!targetUser) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });

        if (targetUser.id === session.userId) {
            return NextResponse.json({ error: 'Você não pode remover a si mesmo' }, { status: 400 });
        }

        await prisma.user.delete({ where: { id: userId } });

        return NextResponse.json({ message: 'Membro removido com sucesso' });
    } catch (error) {
        console.error('Family DELETE error:', error);
        return NextResponse.json({ error: 'Erro ao remover membro' }, { status: 500 });
    }
}
