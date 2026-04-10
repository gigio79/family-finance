import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

/**
 * Operações em transações individuais (Confirmar/Deletar)
 */
export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { status } = await req.json();
        const { id } = await params;

        await query(
            'UPDATE transacoes SET status = $1 WHERE id = $2',
            [status, id]
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Erro ao atualizar transação:', error);
        return NextResponse.json({ error: 'Falha ao atualizar' }, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        await query('DELETE FROM transacoes WHERE id = $1', [id]);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Erro ao deletar transação:', error);
        return NextResponse.json({ error: 'Falha ao deletar' }, { status: 500 });
    }
}
