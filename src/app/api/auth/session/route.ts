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
        return NextResponse.json({ authenticated: true, user: session });
    } catch {
        return NextResponse.json({ authenticated: false }, { status: 401 });
    }
}
