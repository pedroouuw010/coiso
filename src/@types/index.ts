export type TransactionType = 'income' | 'expense';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type?: TransactionType | 'both';
  isDefault?: boolean;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  date: string;
  createdAt: string;
  // Parcelas
  installmentGroupId?: string;
  installmentNumber?: number;
  installmentTotal?: number;
}

export interface Budget {
  id: string;
  categoryId: string;
  limitAmount: number;
}

// ── METAS ──────────────────────────────────────────────
export type GoalStatus = 'active' | 'paused' | 'completed';

export interface Goal {
  id: string;
  name: string;
  icon: string;
  targetAmount: number;
  savedAmount: number;
  deadline?: string; // ISO date string
  description?: string;
  status: GoalStatus;
  createdAt: string;
}

// ── GASTOS RECORRENTES ─────────────────────────────────
export type RecurringFrequency = 'weekly' | 'biweekly' | 'monthly' | 'yearly' | 'custom';

export interface RecurringExpense {
  id: string;
  name: string;
  amount: number;
  categoryId: string;
  frequency: RecurringFrequency;
  nextDueDate: string; // ISO date string
  customDays?: number; // Para frequência personalizada
  repetitions?: number; // undefined = infinito
  repetitionsDone: number;
  isActive: boolean;
  createdAt: string;
}

// ── GRUPOS DE PARCELAS ─────────────────────────────────
export interface InstallmentGroup {
  id: string;
  description: string;
  totalAmount: number;
  installmentCount: number;
  categoryId: string;
  startDate: string;
  createdAt: string;
}

// ── ALERTAS ───────────────────────────────────────────
export type AlertType = 'warning' | 'info' | 'success' | 'danger';

export interface AppAlert {
  id: string;
  type: AlertType;
  title: string;
  message: string;
  createdAt: string;
}

// ── TEMA ──────────────────────────────────────────────
export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
  background: string;
  card: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  primary: string;
  primaryLight: string;
  income: string;
  incomeLight: string;
  expense: string;
  expenseLight: string;
  warning: string;
  warningLight: string;
  tabBar: string;
  tabBarActive: string;
  tabBarInactive: string;
  modalOverlay: string;
  inputBackground: string;
}

export interface MonthYear {
  month: number; // 0-11
  year: number;
}
