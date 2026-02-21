import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { comparePassword, signToken } from '@/lib/auth';
import { updateStreak, awardPoints } from '@/lib/gamification';

export async function POST(req: NextRequest) {
    try {
        const { email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json({ error: 'Email e senha são obrigatórios' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { email },
            include: { family: true },
        });

        if (!user) {
            return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
        }

        const valid = await comparePassword(password, user.password);
        if (!valid) {
            return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
        }

        // Update streak and award daily login points
        await updateStreak(user.id);
        await awardPoints(user.id, 'DAILY_LOGIN');

        const token = await signToken({
            userId: user.id,
            familyId: user.familyId,
            role: user.role,
            name: user.name,
            email: user.email,
        });

        const response = NextResponse.json({
            message: 'Login bem-sucedido!',
            user: { id: user.id, name: user.name, email: user.email, role: user.role },
            family: { id: user.family.id, name: user.family.name },
        });

        response.cookies.set('auth-token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7,
            path: '/',
        });

        return response;
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}
