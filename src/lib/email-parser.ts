// Email parser module - Mock for MVP, ready for Gmail OAuth integration
// Parses Brazilian bank email patterns using regex

export interface ParsedTransaction {
    amount: number;
    establishment: string;
    date: string;
    rawText: string;
    confidence: number;
}

// Common Brazilian bank email patterns
const PATTERNS = [
    // Nubank style
    {
        regex: /compra\s+(?:aprovada|realizada)\s+(?:de\s+)?R\$\s*([\d.,]+)\s+(?:em|no|na)\s+(.+?)(?:\s+em\s+(\d{2}\/\d{2}\/\d{4}))?/i,
        extract: (match: RegExpMatchArray): ParsedTransaction => ({
            amount: parseAmount(match[1]),
            establishment: match[2].trim(),
            date: match[3] || new Date().toISOString().split('T')[0],
            rawText: match[0],
            confidence: 0.9,
        }),
    },
    // Itaú / Bradesco style
    {
        regex: /d[eé]bito\s+(?:de\s+)?R\$\s*([\d.,]+)\s+(.+?)(?:\s+(\d{2}\/\d{2}))?/i,
        extract: (match: RegExpMatchArray): ParsedTransaction => ({
            amount: parseAmount(match[1]),
            establishment: match[2].trim(),
            date: match[3] ? `${match[3]}/${new Date().getFullYear()}` : new Date().toISOString().split('T')[0],
            rawText: match[0],
            confidence: 0.8,
        }),
    },
    // Generic pattern
    {
        regex: /R\$\s*([\d.,]+)\s+(?:em|no|na|para)\s+(.+)/i,
        extract: (match: RegExpMatchArray): ParsedTransaction => ({
            amount: parseAmount(match[1]),
            establishment: match[2].trim().substring(0, 50),
            date: new Date().toISOString().split('T')[0],
            rawText: match[0],
            confidence: 0.6,
        }),
    },
];

function parseAmount(str: string): number {
    // Handle Brazilian format: 1.234,56
    return parseFloat(str.replace(/\./g, '').replace(',', '.'));
}

export function parseEmailContent(content: string): ParsedTransaction[] {
    const results: ParsedTransaction[] = [];

    for (const pattern of PATTERNS) {
        const match = content.match(pattern.regex);
        if (match) {
            results.push(pattern.extract(match));
        }
    }

    return results;
}

// Category suggestion based on establishment keywords
const CATEGORY_RULES: Record<string, string[]> = {
    'Alimentação': ['restaurante', 'ifood', 'uber eats', 'rappi', 'mercado', 'supermercado', 'padaria', 'lanchonete', 'pizza', 'burger'],
    'Transporte': ['uber', '99', 'posto', 'combustível', 'estacionamento', 'pedágio', 'metro', 'ônibus'],
    'Saúde': ['farmácia', 'drogaria', 'médico', 'hospital', 'lab', 'clínica', 'dentista'],
    'Educação': ['escola', 'curso', 'livro', 'udemy', 'coursera'],
    'Lazer': ['cinema', 'teatro', 'netflix', 'spotify', 'game', 'bar'],
    'Moradia': ['aluguel', 'condomínio', 'luz', 'água', 'gás', 'internet', 'energia'],
    'Vestuário': ['roupa', 'calçado', 'sapato', 'loja', 'shopping', 'renner', 'zara'],
};

export function suggestCategory(establishment: string): { category: string; confidence: number } | null {
    const lower = establishment.toLowerCase();

    for (const [category, keywords] of Object.entries(CATEGORY_RULES)) {
        for (const keyword of keywords) {
            if (lower.includes(keyword)) {
                return { category, confidence: 0.85 };
            }
        }
    }

    return null;
}

// Mock email data for demo purposes
export const MOCK_EMAILS: ParsedTransaction[] = [
    { amount: 45.90, establishment: 'iFood - Restaurante Sabor Caseiro', date: '2026-02-18', rawText: 'Compra aprovada de R$ 45,90 em iFood', confidence: 0.9 },
    { amount: 89.00, establishment: 'Uber - Corrida', date: '2026-02-19', rawText: 'Débito de R$ 89,00 Uber', confidence: 0.8 },
    { amount: 320.50, establishment: 'Supermercado Extra', date: '2026-02-20', rawText: 'Compra realizada de R$ 320,50 em Supermercado Extra', confidence: 0.9 },
];
