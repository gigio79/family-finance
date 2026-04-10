export interface ExtractedData {
    tipo: 'credito' | 'debito' | 'pix_recebido' | 'pix_enviado' | 'desconhecido';
    valor: number | null;
    estabelecimento: string | null;
    data: string | null;
    descricao_original: string;
}

export async function extractFinancialData(message: string): Promise<ExtractedData> {
    try {
        const response = await fetch('/api/extract', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message }),
        });

        if (!response.ok) {
            throw new Error('Falha na extração de dados');
        }

        return await response.json();
    } catch (error) {
        console.error('Error extracting data:', error);
        throw error;
    }
}
