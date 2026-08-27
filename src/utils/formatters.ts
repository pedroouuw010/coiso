export const formatCurrency = (value: number): string => {
  if (isNaN(value)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const formatCurrencyBRL = formatCurrency;

export const formatDateDisplay = (dateString: string): string => {
  try {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-').map(Number);
    if (!year || !month || !day) return dateString;

    const date = new Date(year, month - 1, day);
    const dayStr = String(day).padStart(2, '0');
    const monthNames = [
      'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
      'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
    ];
    return `${dayStr} ${monthNames[date.getMonth()]} ${year}`;
  } catch {
    return dateString;
  }
};

export const formatDateShort = (dateString: string): string => {
  try {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  } catch {
    return dateString;
  }
};

export const parseCurrencyInput = (value: string): number => {
  if (!value) return 0;
  const cleaned = value.replace(/[^\d,-]/g, '').replace(',', '.');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};
