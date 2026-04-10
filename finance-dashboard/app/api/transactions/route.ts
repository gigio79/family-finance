import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

/**
 * Listagem de transações filtradas
 */
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');

        let sql = 'SELECT * FROM transacoes';
        const params: any[] = [];

        if (status) {
            sql += ' WHERE status = $1';
            params.push(status);
        }

        sql += ' ORDER BY created_at DESC';

        const result = await query(sql, params);
        return NextResponse.json(result.rows);

    } catch (error) {
        console.error('Erro ao buscar transações:', error);
        return NextResponse.json({ error: 'Falha ao buscar dados' }, { status: 500 });
    }
}
