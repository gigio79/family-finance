/**
 * Mapeamento de palavras-chave para categorias financeiras.
 * A ordem de definição influencia a prioridade de busca.
 */
const CATEGORY_MAP: Record<string, string[]> = {
    'Alimentação': ['ifood', 'restaurante', 'lanchonete', 'padaria', 'mc donalds', 'burger king'],
    'Transporte': ['uber', '99', 'gasolina', 'posto', 'estacionamento', 'pedágio'],
    'Mercado': ['mercado', 'supermercado', 'atacadão', 'pão de açúcar', 'extra', 'carrefour'],
    'Assinaturas': ['netflix', 'spotify', 'prime', 'disney', 'hbo', 'youtube premium'],
    'Saúde': ['farmacia', 'drogasil', 'droga', 'hospital', 'médico', 'consulta']
};

/**
 * Função simplificada para categorizar um estabelecimento com base em palavras-chave.
 * Transforma o texto em lowercase e prioriza palavras mais específicas.
 */
export function categorizeTransaction(estabelecimento: string): string {
    if (!estabelecimento) return 'Outros';

    const text = estabelecimento.toLowerCase().trim();

    // Itera pelas categorias e suas palavras-chave
    for (const [category, keywords] of Object.entries(CATEGORY_MAP)) {
        for (const keyword of keywords) {
            if (text.includes(keyword)) {
                return category;
            }
        }
    }

    return 'Outros';
}
