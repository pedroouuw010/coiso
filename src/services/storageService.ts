import AsyncStorage from '@react-native-async-storage/async-storage';
import { Transaction, Category, Budget, ThemeMode, Goal, RecurringExpense, InstallmentGroup } from '../@types';
import { DEFAULT_CATEGORIES } from '../constants/defaultCategories';

const STORAGE_KEYS = {
  TRANSACTIONS: '@finance_transactions_v1',
  CATEGORIES: '@finance_categories_v1',
  BUDGETS: '@finance_budgets_v1',
  THEME: '@finance_theme_v1',
  GOALS: '@finance_goals_v1',
  RECURRING: '@finance_recurring_v1',
  INSTALLMENT_GROUPS: '@finance_installment_groups_v1',
};

export const storageService = {
  // ── TRANSAÇÕES ─────────────────────────────
  async getTransactions(): Promise<Transaction[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      return data ? JSON.parse(data) : [];
    } catch { return []; }
  },
  async saveTransactions(transactions: Transaction[]): Promise<void> {
    try { await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions)); } catch {}
  },

  // ── CATEGORIAS ────────────────────────────
  async getCategories(): Promise<Category[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.CATEGORIES);
      if (!data) { await this.saveCategories(DEFAULT_CATEGORIES); return DEFAULT_CATEGORIES; }
      return JSON.parse(data);
    } catch { return DEFAULT_CATEGORIES; }
  },
  async saveCategories(categories: Category[]): Promise<void> {
    try { await AsyncStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories)); } catch {}
  },

  // ── ORÇAMENTOS ────────────────────────────
  async getBudgets(): Promise<Budget[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.BUDGETS);
      return data ? JSON.parse(data) : [];
    } catch { return []; }
  },
  async saveBudgets(budgets: Budget[]): Promise<void> {
    try { await AsyncStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(budgets)); } catch {}
  },

  // ── TEMA ─────────────────────────────────
  async getTheme(): Promise<ThemeMode> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.THEME);
      return (data as ThemeMode) || 'dark';
    } catch { return 'dark'; }
  },
  async saveTheme(theme: ThemeMode): Promise<void> {
    try { await AsyncStorage.setItem(STORAGE_KEYS.THEME, theme); } catch {}
  },

  // ── METAS ────────────────────────────────
  async getGoals(): Promise<Goal[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.GOALS);
      return data ? JSON.parse(data) : [];
    } catch { return []; }
  },
  async saveGoals(goals: Goal[]): Promise<void> {
    try { await AsyncStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals)); } catch {}
  },

  // ── RECORRENTES ──────────────────────────
  async getRecurring(): Promise<RecurringExpense[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.RECURRING);
      return data ? JSON.parse(data) : [];
    } catch { return []; }
  },
  async saveRecurring(list: RecurringExpense[]): Promise<void> {
    try { await AsyncStorage.setItem(STORAGE_KEYS.RECURRING, JSON.stringify(list)); } catch {}
  },

  // ── GRUPOS DE PARCELAS ───────────────────
  async getInstallmentGroups(): Promise<InstallmentGroup[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.INSTALLMENT_GROUPS);
      return data ? JSON.parse(data) : [];
    } catch { return []; }
  },
  async saveInstallmentGroups(groups: InstallmentGroup[]): Promise<void> {
    try { await AsyncStorage.setItem(STORAGE_KEYS.INSTALLMENT_GROUPS, JSON.stringify(groups)); } catch {}
  },

  // ── LIMPAR TUDO ──────────────────────────
  async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
    } catch {}
  },
};
