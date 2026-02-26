export const formatCurrency = (value?: number | null): string => {
  return (value ?? 0).toLocaleString('pt-BR', { 
    style: 'currency', 
    currency: 'BRL' 
  });
};

export const formatDate = (date: string | Date | null | undefined): string => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('pt-BR');
};

export const formatDateTime = (date: string | Date | null | undefined): string => {
  if (!date) return '-';
  return new Date(date).toLocaleString('pt-BR');
};

export const formatPercent = (value?: number | null): string => {
  return `${(value ?? 0).toFixed(1)}%`;
};

export const formatNumber = (value?: number | null, decimals: number = 2): string => {
  return (value ?? 0).toLocaleString('pt-BR', { 
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals 
  });
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

export const capitalize = (text: string): string => {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

export const getMonthName = (date: Date): string => {
  return date.toLocaleDateString('pt-BR', { month: 'long' });
};

export const getMonthYear = (date: Date): string => {
  return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
};
