import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, signToken } from '@/lib/auth';
import { v4 as uuid } from 'uuid';

export async function POST(req: NextRequest) {
    try {
        const { name, email, password, familyName } = await req.json();

        if (!name || !email || !password || !familyName) {
            return NextResponse.json({ error: 'Todos os campos são obrigatórios' }, { status: 400 });
        }

        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return NextResponse.json({ error: 'Email já cadastrado' }, { status: 409 });
        }

        const hashedPassword = await hashPassword(password);

        // Create family and admin user
        const family = await prisma.family.create({
            data: {
                name: familyName,
                users: {
                    create: {
                        name,
                        email,
                        password: hashedPassword,
                        role: 'ADMIN',
                    },
                },
                categories: {
                    createMany: {
                        data: [
                            { name: 'Alimentação', icon: '🍔', color: '#ef4444', rules: JSON.stringify(['restaurante', 'ifood', 'mercado', 'supermercado', 'padaria']) },
                            { name: 'Transporte', icon: '🚗', color: '#f59e0b', rules: JSON.stringify(['uber', '99', 'posto', 'combustível', 'estacionamento']) },
                            { name: 'Moradia', icon: '🏠', color: '#3b82f6', rules: JSON.stringify(['aluguel', 'condomínio', 'luz', 'água', 'gás', 'internet']) },
                            { name: 'Saúde', icon: '💊', color: '#10b981', rules: JSON.stringify(['farmácia', 'médico', 'hospital', 'clínica']) },
                            { name: 'Educação', icon: '📚', color: '#8b5cf6', rules: JSON.stringify(['escola', 'curso', 'livro', 'universidade']) },
                            { name: 'Lazer', icon: '🎮', color: '#ec4899', rules: JSON.stringify(['cinema', 'netflix', 'spotify', 'teatro', 'bar']) },
                            { name: 'Vestuário', icon: '👕', color: '#14b8a6', rules: JSON.stringify(['roupa', 'calçado', 'loja', 'shopping']) },
                            { name: 'Salário', icon: '💰', color: '#22c55e', rules: JSON.stringify(['salário', 'pagamento', 'freelance']) },
                            { name: 'Outros', icon: '📦', color: '#6366f1', rules: JSON.stringify([]) },
                        ],
                    },
                },
            },
            include: { users: true },
        });

        const user = family.users[0];
        const token = await signToken({
            userId: user.id,
            familyId: family.id,
            role: user.role,
            name: user.name,
            email: user.email,
        });

        const response = NextResponse.json({
            message: 'Família criada com sucesso!',
            user: { id: user.id, name: user.name, email: user.email, role: user.role },
            family: { id: family.id, name: family.name },
        });

        response.cookies.set('auth-token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: '/',
        });

        return response;
    } catch (error) {
        console.error('Register error:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}
