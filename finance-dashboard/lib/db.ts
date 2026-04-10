import { Pool } from 'pg';

/**
 * Conexão com o banco de dados Neon (PostgreSQL)
 * Utiliza pooling para máxima performance e reaproveitamento de conexões.
 */

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error('ERRO: DATABASE_URL não configurada no .env.local');
}

export const pool = new Pool({
    connectionString,
    ssl: {
        rejectUnauthorized: false // Necessário para conexões seguras com Neon
    }
});

/**
 * Função utilitária para executar queries
 */
export async function query(text: string, params?: unknown[]) {
    const start = Date.now();
    try {
        const res = await pool.query(text, params);
        const duration = Date.now() - start;
        console.log('Query executada com sucesso', { text, duration, rows: res.rowCount });
        return res;
    } catch (error) {
        console.error('Erro na execução da query', { text, error });
        throw error;
    }
}
