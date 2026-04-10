import { DashboardData, Transaction } from './types';

const N8N_WEBHOOK_URL = 'https://managern8neditor01.conectagente.online/webhook/finance'; // Replace with env var in prod

export async function uploadFile(file: File): Promise<DashboardData> {
    const formData = new FormData();
    formData.append('data', file);
    formData.append('source', file.type === 'application/pdf' ? 'pdf' : 'csv');

    const res = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        body: formData,
    });

    if (!res.ok) {
        throw new Error('Falha ao enviar arquivo');
    }

    return res.json();
}

export async function sendTransaction(transaction: Partial<Transaction>): Promise<DashboardData> {
    const res = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            source: 'manual',
            ...transaction
        }),
    });

    if (!res.ok) {
        throw new Error('Falha ao salvar transação');
    }

    return res.json();
}
