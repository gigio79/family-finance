import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { password } = await req.json();
        const correctPassword = process.env.DASHBOARD_PASSWORD;

        if (password === correctPassword) {
            const response = NextResponse.json({ success: true });
            
            // Set session cookie (valid for 30 days)
            response.cookies.set('neo_auth', 'true', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 60 * 60 * 24 * 30,
                path: '/',
            });

            return response;
        }

        return NextResponse.json({ error: 'Senha incorreta' }, { status: 401 });
    } catch {
        return NextResponse.json({ error: 'Erro no servidor' }, { status: 500 });
    }
}
