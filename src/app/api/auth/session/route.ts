export const runtime = "nodejs";
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST() {
    const response = NextResponse.json({ message: 'Logout realizado' });
    response.cookies.set('auth-token', '', { maxAge: 0, path: '/' });
    return response;
}

export async function GET() {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ authenticated: false }, { status: 401 });
        }

        const dbUser = await prisma.user.findUnique({
            where: { id: session.userId },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                avatar: true,
                familyId: true
            }
        });

        return NextResponse.json({ 
            authenticated: true, 
            user: dbUser
        });
    } catch {
        return NextResponse.json({ authenticated: false }, { status: 401 });
    }
}
