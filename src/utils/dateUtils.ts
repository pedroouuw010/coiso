import { MonthYear } from '../@types';

export const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

export const getMonthName = (monthIndex: number): string => {
  return MONTH_NAMES[monthIndex] || '';
};

export const getCurrentMonthYear = (): MonthYear => {
  const now = new Date();
  return {
    month: now.getMonth(),
    year: now.getFullYear(),
  };
};

export const getTodayDateString = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatDateBR = (dateString: string): string => {
  try {
    if (!dateString) return '';
    const datePart = dateString.split('T')[0];
    const parts = datePart.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateString;
  } catch {
    return dateString;
  }
};

export const formatMonthYear = (monthYear: MonthYear): string => {
  return `${MONTH_NAMES[monthYear.month]} ${monthYear.year}`;
};

export const getPreviousMonth = (monthYear: MonthYear): MonthYear => {
  if (monthYear.month === 0) {
    return { month: 11, year: monthYear.year - 1 };
  }
  return { month: monthYear.month - 1, year: monthYear.year };
};

export const getNextMonth = (monthYear: MonthYear): MonthYear => {
  if (monthYear.month === 11) {
    return { month: 0, year: monthYear.year + 1 };
  }
  return { month: monthYear.month + 1, year: monthYear.year };
};

export const isDateInMonthYear = (dateString: string, monthYear: MonthYear): boolean => {
  if (!dateString) return false;
  const parts = dateString.split('-');
  if (parts.length < 2) return false;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // 0-indexed
  return year === monthYear.year && month === monthYear.month;
};
