import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { message } = await req.json();

        if (!message) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }

        // Rule-based parsing as a robust fallback/mock 
        // In a real scenario, you would call OpenAI/Gemini with the prompt provided by the user.
        
        const extracted = parseNotification(message);

        return NextResponse.json(extracted);
    } catch (error) {
        console.error('Extraction error:', error);
        return NextResponse.json({ error: 'Failed to extract data' }, { status: 500 });
    }
}

function parseNotification(text: string) {
    // Basic regex-based parsing following the user's extraction rules 
    // as a placeholder until a real LLM is connected.
    
    // 1. VALOR: converter vírgula para ponto, remover R$
    const amountMatch = text.match(/R\$\s?(\d+(?:[.]\d{3})*(?:,\d{2})?)/i) || text.match(/(\d+(?:[.]\d{3})*(?:,\d{2}))/);
    let valor = null;
    if (amountMatch) {
        let cleanAmount = amountMatch[1].replace(/\./g, '').replace(',', '.');
        valor = parseFloat(cleanAmount);
    }

    // 2. TIPO
    let tipo = 'desconhecido';
    if (/compra|débito|cartão/i.test(text)) tipo = 'debito';
    if (/recebido|pix recebido/i.test(text)) tipo = 'pix_recebido';
    if (/enviou|pix enviado/i.test(text)) tipo = 'pix_enviado';
    if (/crédito na conta/i.test(text)) tipo = 'credito';

    // 3. ESTABELECIMENTO: Nome do local ou pessoa
    let estabelecimento = null;
    // Common patterns: "no iFood", "de João", "para Uber"
    const estMatch = text.match(/(?:no\s|em\s|de\s|para\s)([\w\s]+?)(?:\scom|\sno|\snas|\spix|\saos|\sàs|$)/i);
    if (estMatch) {
        estabelecimento = estMatch[1].trim();
    }

    // 4. DATA: YYYY-MM-DD HH:MM:SS
    const now = new Date();
    const formattedDate = now.toISOString().replace('T', ' ').split('.')[0];

    return {
        tipo,
        valor,
        estabelecimento,
        data: formattedDate,
        descricao_original: text
    };
}
