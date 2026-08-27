import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Transaction, Category, Budget, MonthYear, Goal, RecurringExpense, InstallmentGroup, AppAlert } from '../@types';
import { storageService } from '../services/storageService';
import { exportService } from '../services/exportService';
import { getCurrentMonthYear, isDateInMonthYear } from '../utils/dateUtils';
import { DEFAULT_CATEGORIES } from '../constants/defaultCategories';
import { parseNubankNotification } from '../services/nubankNotificationService';

// ─────────────────────────────────────────────────────────────────
// Tipos do Contexto
// ─────────────────────────────────────────────────────────────────
interface FinanceContextData {
  // Estado base
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  isLoading: boolean;
  selectedMonthYear: MonthYear;
  setSelectedMonthYear: (my: MonthYear) => void;
  // Métricas mensais
  currentBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  monthlyBalance: number;
  recentTransactions: Transaction[];
  filteredTransactions: Transaction[];
  // Transações CRUD
  addTransaction: (t: Omit<Transaction, 'id' | 'createdAt'>) => Promise<void>;
  addInstallmentTransaction: (data: { description: string; totalAmount: number; installmentCount: number; categoryId: string; startDate: string }) => Promise<void>;
  updateTransaction: (t: Transaction) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  // Categorias CRUD
  addCategory: (c: Omit<Category, 'id' | 'isDefault'>) => Promise<void>;
  deleteCategory: (id: string) => Promise<boolean>;
  getCategoryById: (id: string) => Category | undefined;
  // Orçamentos CRUD
  setBudget: (categoryId: string, limitAmount: number) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  getCategorySpentInMonth: (categoryId: string, monthYear?: MonthYear) => number;
  // Modal de Transação
  isTransactionModalVisible: boolean;
  editingTransaction: Transaction | null;
  openAddTransactionModal: () => void;
  openEditTransactionModal: (t: Transaction) => void;
  closeTransactionModal: () => void;
  // Exportação
  exportCSV: () => Promise<boolean>;
  exportJSON: () => Promise<boolean>;
  // Nubank
  processNubankNotification: (title: string, message: string) => Promise<boolean>;
  // ── METAS ──────────────────────────────
  goals: Goal[];
  addGoal: (g: Omit<Goal, 'id' | 'createdAt' | 'savedAmount' | 'status'>) => Promise<void>;
  updateGoal: (g: Goal) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  addToGoal: (id: string, amount: number) => Promise<void>;
  withdrawFromGoal: (id: string, amount: number) => Promise<void>;
  // ── RECORRENTES ────────────────────────
  recurring: RecurringExpense[];
  addRecurring: (r: Omit<RecurringExpense, 'id' | 'createdAt' | 'repetitionsDone'>) => Promise<void>;
  updateRecurring: (r: RecurringExpense) => Promise<void>;
  deleteRecurring: (id: string) => Promise<void>;
  toggleRecurring: (id: string) => Promise<void>;
  // ── PARCELAS ───────────────────────────
  installmentGroups: InstallmentGroup[];
  getInstallmentsByGroup: (groupId: string) => Transaction[];
  // ── INSIGHTS ───────────────────────────
  alerts: AppAlert[];
  insights: string[];
}

const FinanceContext = createContext<FinanceContextData>({} as FinanceContextData);

// ─────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────
export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [recurring, setRecurring] = useState<RecurringExpense[]>([]);
  const [installmentGroups, setInstallmentGroups] = useState<InstallmentGroup[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedMonthYear, setSelectedMonthYear] = useState<MonthYear>(getCurrentMonthYear());
  const [isTransactionModalVisible, setIsTransactionModalVisible] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // ── Carregar dados ─────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const [tx, cats, bud, gls, rec, ig] = await Promise.all([
          storageService.getTransactions(),
          storageService.getCategories(),
          storageService.getBudgets(),
          storageService.getGoals(),
          storageService.getRecurring(),
          storageService.getInstallmentGroups(),
        ]);
        setTransactions(tx);
        setCategories(cats);
        setBudgets(bud);
        setGoals(gls);
        setRecurring(rec);
        setInstallmentGroups(ig);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  // ── Cálculos financeiros ───────────────
  const currentBalance = useMemo(() =>
    transactions.reduce((acc, t) => t.type === 'income' ? acc + t.amount : acc - t.amount, 0),
  [transactions]);

  const filteredTransactions = useMemo(() =>
    transactions
      .filter(t => isDateInMonthYear(t.date, selectedMonthYear))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
  [transactions, selectedMonthYear]);

  const monthlyIncome = useMemo(() =>
    filteredTransactions.filter(t => t.type === 'income').reduce((a, t) => a + t.amount, 0),
  [filteredTransactions]);

  const monthlyExpense = useMemo(() =>
    filteredTransactions.filter(t => t.type === 'expense').reduce((a, t) => a + t.amount, 0),
  [filteredTransactions]);

  const monthlyBalance = useMemo(() => monthlyIncome - monthlyExpense, [monthlyIncome, monthlyExpense]);

  const recentTransactions = useMemo(() =>
    [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5),
  [transactions]);

  // ── Insights Automáticos ───────────────
  const insights = useMemo(() => {
    const result: string[] = [];
    if (transactions.length === 0) return result;

    // Comparação com mês anterior
    const prev = { month: selectedMonthYear.month === 0 ? 11 : selectedMonthYear.month - 1, year: selectedMonthYear.month === 0 ? selectedMonthYear.year - 1 : selectedMonthYear.year };
    const prevTx = transactions.filter(t => isDateInMonthYear(t.date, prev));
    const prevExpense = prevTx.filter(t => t.type === 'expense').reduce((a, t) => a + t.amount, 0);

    if (prevExpense > 0 && monthlyExpense > 0) {
      const diff = ((monthlyExpense - prevExpense) / prevExpense) * 100;
      if (diff > 10) result.push(`📈 Seus gastos aumentaram ${diff.toFixed(0)}% em relação ao mês passado.`);
      else if (diff < -10) result.push(`📉 Seus gastos caíram ${Math.abs(diff).toFixed(0)}% em relação ao mês passado.`);
    }

    if (monthlyBalance > 0) result.push(`💰 Você economizou R$ ${monthlyBalance.toFixed(2).replace('.', ',')} este mês.`);

    // Maior categoria de gasto
    const byCat: Record<string, number> = {};
    filteredTransactions.filter(t => t.type === 'expense').forEach(t => { byCat[t.categoryId] = (byCat[t.categoryId] || 0) + t.amount; });
    const topCatId = Object.entries(byCat).sort((a, b) => b[1] - a[1])[0]?.[0];
    const topCat = categories.find(c => c.id === topCatId);
    if (topCat) result.push(`🏷️ "${topCat.name}" foi sua maior categoria de gastos este mês.`);

    // Metas próximas
    const nearGoal = goals.find(g => g.status === 'active' && g.targetAmount > 0 && g.savedAmount / g.targetAmount >= 0.8);
    if (nearGoal) result.push(`🎯 Você está quase atingindo sua meta "${nearGoal.name}"!`);

    return result;
  }, [transactions, filteredTransactions, monthlyExpense, monthlyBalance, categories, goals, selectedMonthYear]);

  // ── Alertas ────────────────────────────
  const alerts = useMemo(() => {
    const result: AppAlert[] = [];
    const now = new Date();

    // Gasto recorrente nos próximos 3 dias
    recurring.filter(r => r.isActive).forEach(r => {
      const due = new Date(r.nextDueDate);
      const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays >= 0 && diffDays <= 3) {
        result.push({ id: `rec-${r.id}`, type: 'warning', title: 'Gasto Recorrente', message: `"${r.name}" vence em ${diffDays === 0 ? 'hoje' : `${diffDays} dia(s)`} — R$ ${r.amount.toFixed(2).replace('.', ',')}`, createdAt: now.toISOString() });
      }
    });

    // Orçamento ultrapassado
    budgets.forEach(b => {
      const cat = categories.find(c => c.id === b.categoryId);
      const spent = filteredTransactions.filter(t => t.type === 'expense' && t.categoryId === b.categoryId).reduce((a, t) => a + t.amount, 0);
      if (spent >= b.limitAmount && cat) {
        result.push({ id: `bud-${b.id}`, type: 'danger', title: 'Orçamento Ultrapassado', message: `Limite de "${cat.name}" foi atingido!`, createdAt: now.toISOString() });
      }
    });

    return result;
  }, [recurring, budgets, filteredTransactions, categories]);

  // ── TRANSAÇÕES CRUD ───────────────────
  const addTransaction = async (t: Omit<Transaction, 'id' | 'createdAt'>) => {
    const newT: Transaction = { ...t, id: `tx_${Date.now()}_${Math.random()}`, createdAt: new Date().toISOString() };
    const updated = [newT, ...transactions];
    setTransactions(updated);
    await storageService.saveTransactions(updated);
  };

  const addInstallmentTransaction = async (data: { description: string; totalAmount: number; installmentCount: number; categoryId: string; startDate: string }) => {
    const groupId = `ig_${Date.now()}`;
    const group: InstallmentGroup = { id: groupId, description: data.description, totalAmount: data.totalAmount, installmentCount: data.installmentCount, categoryId: data.categoryId, startDate: data.startDate, createdAt: new Date().toISOString() };
    const updatedGroups = [group, ...installmentGroups];
    setInstallmentGroups(updatedGroups);
    await storageService.saveInstallmentGroups(updatedGroups);

    const installmentAmount = data.totalAmount / data.installmentCount;
    const newTxs: Transaction[] = [];
    const startDate = new Date(data.startDate);
    for (let i = 0; i < data.installmentCount; i++) {
      const d = new Date(startDate.getFullYear(), startDate.getMonth() + i, startDate.getDate());
      newTxs.push({ id: `tx_${Date.now()}_${i}`, description: `${data.description} (${i + 1}/${data.installmentCount})`, amount: installmentAmount, type: 'expense', categoryId: data.categoryId, date: d.toISOString(), createdAt: new Date().toISOString(), installmentGroupId: groupId, installmentNumber: i + 1, installmentTotal: data.installmentCount });
    }
    const updated = [...newTxs, ...transactions];
    setTransactions(updated);
    await storageService.saveTransactions(updated);
  };

  const updateTransaction = async (t: Transaction) => {
    const updated = transactions.map(x => x.id === t.id ? t : x);
    setTransactions(updated);
    await storageService.saveTransactions(updated);
  };

  const deleteTransaction = async (id: string) => {
    const updated = transactions.filter(t => t.id !== id);
    setTransactions(updated);
    await storageService.saveTransactions(updated);
  };

  // ── CATEGORIAS CRUD ───────────────────
  const addCategory = async (c: Omit<Category, 'id' | 'isDefault'>) => {
    const newC: Category = { ...c, id: `cat_${Date.now()}`, isDefault: false };
    const updated = [...categories, newC];
    setCategories(updated);
    await storageService.saveCategories(updated);
  };

  const deleteCategory = async (id: string): Promise<boolean> => {
    if (transactions.some(t => t.categoryId === id)) return false;
    const updated = categories.filter(c => c.id !== id);
    setCategories(updated);
    await storageService.saveCategories(updated);
    return true;
  };

  const getCategoryById = (id: string) => categories.find(c => c.id === id);

  // ── ORÇAMENTOS CRUD ───────────────────
  const setBudget = async (categoryId: string, limitAmount: number) => {
    const existing = budgets.find(b => b.categoryId === categoryId);
    let updated: Budget[];
    if (existing) { updated = budgets.map(b => b.categoryId === categoryId ? { ...b, limitAmount } : b); }
    else { updated = [...budgets, { id: `bud_${Date.now()}`, categoryId, limitAmount }]; }
    setBudgets(updated);
    await storageService.saveBudgets(updated);
  };

  const deleteBudget = async (id: string) => {
    const updated = budgets.filter(b => b.id !== id);
    setBudgets(updated);
    await storageService.saveBudgets(updated);
  };

  const getCategorySpentInMonth = (categoryId: string, my?: MonthYear): number => {
    const target = my || selectedMonthYear;
    return transactions.filter(t => t.type === 'expense' && t.categoryId === categoryId && isDateInMonthYear(t.date, target)).reduce((a, t) => a + t.amount, 0);
  };

  // ── MODAL ─────────────────────────────
  const openAddTransactionModal = () => { setEditingTransaction(null); setIsTransactionModalVisible(true); };
  const openEditTransactionModal = (t: Transaction) => { setEditingTransaction(t); setIsTransactionModalVisible(true); };
  const closeTransactionModal = () => { setIsTransactionModalVisible(false); setEditingTransaction(null); };

  // ── EXPORTAÇÃO ────────────────────────
  const exportCSV = async () => exportService.exportToCSV(transactions, categories);
  const exportJSON = async () => exportService.exportToJSON(transactions, categories, budgets);

  // ── NUBANK ────────────────────────────
  const processNubankNotification = async (title: string, message: string): Promise<boolean> => {
    const parsed = parseNubankNotification(title, message);
    if (!parsed || parsed.amount <= 0) return false;
    const matchedCategory = categories.find(c => c.name.toLowerCase() === parsed.suggestedCategoryName.toLowerCase()) || categories.find(c => c.name === 'Outros') || categories[0];
    await addTransaction({ amount: parsed.amount, type: parsed.type, categoryId: matchedCategory.id, description: parsed.description, date: new Date().toISOString() });
    return true;
  };

  // ── METAS CRUD ────────────────────────
  const addGoal = async (g: Omit<Goal, 'id' | 'createdAt' | 'savedAmount' | 'status'>) => {
    const newG: Goal = { ...g, id: `goal_${Date.now()}`, savedAmount: 0, status: 'active', createdAt: new Date().toISOString() };
    const updated = [newG, ...goals];
    setGoals(updated);
    await storageService.saveGoals(updated);
  };

  const updateGoal = async (g: Goal) => {
    const updated = goals.map(x => x.id === g.id ? g : x);
    setGoals(updated);
    await storageService.saveGoals(updated);
  };

  const deleteGoal = async (id: string) => {
    const updated = goals.filter(g => g.id !== id);
    setGoals(updated);
    await storageService.saveGoals(updated);
  };

  const addToGoal = async (id: string, amount: number) => {
    const updated = goals.map(g => {
      if (g.id !== id) return g;
      const newSaved = g.savedAmount + amount;
      return { ...g, savedAmount: newSaved, status: newSaved >= g.targetAmount ? 'completed' as const : g.status };
    });
    setGoals(updated);
    await storageService.saveGoals(updated);
  };

  const withdrawFromGoal = async (id: string, amount: number) => {
    const updated = goals.map(g => g.id !== id ? g : { ...g, savedAmount: Math.max(0, g.savedAmount - amount) });
    setGoals(updated);
    await storageService.saveGoals(updated);
  };

  // ── RECORRENTES CRUD ──────────────────
  const addRecurring = async (r: Omit<RecurringExpense, 'id' | 'createdAt' | 'repetitionsDone'>) => {
    const newR: RecurringExpense = { ...r, id: `rec_${Date.now()}`, repetitionsDone: 0, createdAt: new Date().toISOString() };
    const updated = [newR, ...recurring];
    setRecurring(updated);
    await storageService.saveRecurring(updated);
  };

  const updateRecurring = async (r: RecurringExpense) => {
    const updated = recurring.map(x => x.id === r.id ? r : x);
    setRecurring(updated);
    await storageService.saveRecurring(updated);
  };

  const deleteRecurring = async (id: string) => {
    const updated = recurring.filter(r => r.id !== id);
    setRecurring(updated);
    await storageService.saveRecurring(updated);
  };

  const toggleRecurring = async (id: string) => {
    const updated = recurring.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r);
    setRecurring(updated);
    await storageService.saveRecurring(updated);
  };

  // ── PARCELAS ─────────────────────────
  const getInstallmentsByGroup = (groupId: string) =>
    transactions.filter(t => t.installmentGroupId === groupId).sort((a, b) => (a.installmentNumber || 0) - (b.installmentNumber || 0));

  return (
    <FinanceContext.Provider value={{
      transactions, categories, budgets, isLoading, selectedMonthYear, setSelectedMonthYear,
      currentBalance, monthlyIncome, monthlyExpense, monthlyBalance, recentTransactions, filteredTransactions,
      addTransaction, addInstallmentTransaction, updateTransaction, deleteTransaction,
      addCategory, deleteCategory, getCategoryById,
      setBudget, deleteBudget, getCategorySpentInMonth,
      isTransactionModalVisible, editingTransaction, openAddTransactionModal, openEditTransactionModal, closeTransactionModal,
      exportCSV, exportJSON, processNubankNotification,
      goals, addGoal, updateGoal, deleteGoal, addToGoal, withdrawFromGoal,
      recurring, addRecurring, updateRecurring, deleteRecurring, toggleRecurring,
      installmentGroups, getInstallmentsByGroup,
      alerts, insights,
    }}>
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error('useFinance deve ser usado dentro de um FinanceProvider');
  return ctx;
};
