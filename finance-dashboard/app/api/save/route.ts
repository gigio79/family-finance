import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { categorizeTransaction } from '@/lib/categorizer';
import crypto from 'crypto';

/**
 * Endpoint para persistência de transações extraídas de notificações.
 * Foco: Normalização, Deduplicação e Segurança.
 */
export async function POST(req: Request) {
    try {
        // 1. SEGURANÇA: Validação de Token
        const authHeader = req.headers.get('Authorization');
        const token = process.env.API_TOKEN;

        if (!authHeader || authHeader !== `Bearer ${token}`) {
            console.warn('Tentativa de acesso não autorizado');
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const body = await req.json();
        console.log('Dados recebidos:', body);

        const { tipo, valor, estabelecimento, data, descricao_original, raw, usuario } = body;
        const transactionUser = usuario || 'Notification';

        // 2. VALIDAÇÕES: Valor deve ser positivo
        if (typeof valor !== 'number' || valor <= 0) {
            console.warn('Valor inválido ignorado:', valor);
            return NextResponse.json({ error: 'Valor inválido' }, { status: 400 });
        }

        // 3. NORMALIZAÇÃO
        const estabelecimentoNormalizado = (estabelecimento || 'Desconhecido').toLowerCase().trim();
        const dataProcessada = data ? new Date(data).toISOString() : new Date().toISOString();

        // 4. HASH (ANTI-DUPLICAÇÃO) - Inclui o usuário para permitir entradas idênticas de membros diferentes
        const baseHash = `${valor}-${estabelecimentoNormalizado}-${tipo}-${transactionUser}`;
        const hash = crypto.createHash('md5').update(baseHash).digest('hex');
        console.log('Hash gerado:', hash);

        // 5. CATEGORIZAÇÃO
        const categoria = categorizeTransaction(estabelecimentoNormalizado);

        // 6. INSERÇÃO NO BANCO (ON CONFLICT DO NOTHING)
        const sql = `
            INSERT INTO transacoes (tipo, valor, estabelecimento, data, descricao_original, raw, hash, categoria, usuario)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (hash) DO NOTHING
            RETURNING id;
        `;

        const result = await query(sql, [
            tipo,
            valor,
            estabelecimentoNormalizado,
            dataProcessada,
            descricao_original,
            raw,
            hash,
            categoria,
            transactionUser
        ]);

        // 7. RESPOSTA E LOGS
        if (result.rowCount === 0) {
            console.log('Resultado: Transação duplicada (ignorado)');
            return NextResponse.json({ sucesso: true, motivo: 'duplicado' });
        }

        console.log('Resultado: Transação salva com sucesso ID', result.rows[0].id);
        return NextResponse.json({ sucesso: true, motivo: 'salvo' });

    } catch (error) {
        console.error('Erro ao salvar transação:', error);
        return NextResponse.json({ error: 'Erro interno ao salvar data' }, { status: 500 });
    }
}
