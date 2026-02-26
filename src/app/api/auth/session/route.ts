export const runtime = "nodejs";
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

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
        return NextResponse.json({ 
            authenticated: true, 
            user: {
                id: session.userId,
                name: session.name,
                email: session.email,
                role: session.role,
                familyId: session.familyId
            }
        });
    } catch {
        return NextResponse.json({ authenticated: false }, { status: 401 });
    }
}
