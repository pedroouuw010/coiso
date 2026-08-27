import { TransactionType } from '../@types';

export interface ParsedNubankNotification {
  amount: number;
  type: TransactionType;
  description: string;
  suggestedCategoryName: string;
  rawText: string;
}

/**
 * Mapeamento de palavras-chave para categorização automática inteligente
 */
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'Alimentação': [
    'restaurante', 'ifood', 'rappi', 'mercado', 'supermercado', 'padaria', 'lanche', 
    'burger', 'pizza', 'acai', 'mcdonalds', 'habibs', 'bar', 'cafe', 'pao'
  ],
  'Transporte': [
    'uber', '99app', '99', 'posto', 'gasolina', 'combustivel', 'estacionamento', 
    'pedagio', 'auto', 'metro', 'onibus'
  ],
  'Lazer': [
    'cinema', 'netflix', 'spotify', 'steam', 'playstation', 'xbox', 'ingresso', 
    'show', 'clube', 'viagem', 'hotel', 'airbnb'
  ],
  'Saúde': [
    'farmacia', 'drogaria', 'droga', 'hospital', 'medico', 'clinica', 'consulta', 
    'exame', 'laboratorio', 'otica', 'panvel', 'raia', 'drogasil'
  ],
  'Educação': [
    'curso', 'faculdade', 'escola', 'livro', 'livraria', 'udemy', 'alura', 'idiomas'
  ],
  'Moradia': [
    'aluguel', 'condominio', 'luz', 'agua', 'energia', 'gas', 'internet', 'claro', 
    'vivo', 'tim', 'enel', 'sabesp', 'copel', 'celesc'
  ],
};

/**
 * Tenta adivinhar a categoria com base no nome do estabelecimento
 */
function guessCategory(text: string): string {
  const lower = text.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        return category;
      }
    }
  }
  return 'Outros';
}

/**
 * Converte string brasileira de moeda (ex: "45,90" ou "1.250,00") para número float
 */
function parseBRLAmount(rawAmountStr: string): number {
  const clean = rawAmountStr.replace(/\./g, '').replace(',', '.');
  const val = parseFloat(clean);
  return isNaN(val) ? 0 : val;
}

/**
 * Analisador (Parser) de notificações emitidas pelo app Nubank (com.nu.production)
 */
export function parseNubankNotification(title: string, message: string): ParsedNubankNotification | null {
  const combined = `${title} ${message}`.trim();
  if (!combined) return null;

  // 1. Padrão: Compra no Cartão de Débito/Crédito
  // Ex: "Compra de R$ 45,90 aprovada em Supermercado Bom Preco"
  // Ex: "Compra aprovada no Nubank de R$ 12,00 no Habib's"
  const cardPurchaseRegex = /compra\s+(?:aprovada\s+)?(?:de\s+)?R\$\s*([\d\.,]+)\s+(?:em|no|na)\s+([^.]+)/i;
  let match = combined.match(cardPurchaseRegex);
  if (match) {
    const amount = parseBRLAmount(match[1]);
    const store = match[2].trim();
    return {
      amount,
      type: 'expense',
      description: `Nubank: ${store}`,
      suggestedCategoryName: guessCategory(store),
      rawText: combined,
    };
  }

  // 2. Padrão: PIX / Transferência Enviada (Despesa)
  // Ex: "Você transferiu R$ 50,00 para João da Silva"
  // Ex: "Transferência de R$ 100,00 realizada com sucesso para..."
  // Ex: "Pix enviado: R$ 30,00 para Maria"
  const pixSentRegex = /(?:transferiu|transferência de|pix enviado:?)\s*(?:R\$\s*)?([\d\.,]+)\s*(?:para|realizada)?\s*([^.]+)?/i;
  match = combined.match(pixSentRegex);
  if (match) {
    const amount = parseBRLAmount(match[1]);
    const receiver = match[2] ? match[2].trim() : 'Transferência Pix';
    return {
      amount,
      type: 'expense',
      description: `Pix Nubank: ${receiver}`,
      suggestedCategoryName: guessCategory(receiver),
      rawText: combined,
    };
  }

  // 3. Padrão: PIX / Transferência Recebida (Receita)
  // Ex: "Você recebeu uma transferência de R$ 200,00 de Fulano"
  // Ex: "Pix recebido: R$ 150,00 de Empresa X"
  const pixReceivedRegex = /(?:recebeu|pix recebido)\s*(?:uma transferência de)?\s*(?:R\$\s*)?([\d\.,]+)\s*(?:de)?\s*([^.]+)?/i;
  match = combined.match(pixReceivedRegex);
  if (match) {
    const amount = parseBRLAmount(match[1]);
    const sender = match[2] ? match[2].trim() : 'Pix Recebido';
    return {
      amount,
      type: 'income',
      description: `Recebido Nubank: ${sender}`,
      suggestedCategoryName: 'Outros',
      rawText: combined,
    };
  }

  // 4. Padrão: Pagamento de Boleto (Despesa)
  // Ex: "Pagamento de boleto de R$ 120,00 realizado"
  const boletoRegex = /pagamento de boleto\s+(?:de\s+)?R\$\s*([\d\.,]+)/i;
  match = combined.match(boletoRegex);
  if (match) {
    const amount = parseBRLAmount(match[1]);
    return {
      amount,
      type: 'expense',
      description: 'Nubank: Pagamento de Boleto',
      suggestedCategoryName: 'Moradia',
      rawText: combined,
    };
  }

  return null;
}
