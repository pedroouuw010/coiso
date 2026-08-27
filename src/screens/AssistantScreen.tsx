import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useFinance } from '../contexts/FinanceContext';
import { formatCurrencyBRL } from '../utils/formatters';
import { isDateInMonthYear, getMonthName } from '../utils/dateUtils';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

interface ConversationContext {
  lastTopic?: 'category' | 'goal' | 'balance' | 'installment' | 'recurring' | 'general';
  lastCategoryId?: string;
  lastCategoryName?: string;
  lastGoalId?: string;
  lastGoalName?: string;
  lastAmount?: number;
}

const SUGGESTIONS = [
  'Como estão minhas finanças?',
  'Onde estou gastando mais?',
  'Se eu gastar R$ 50 hoje, quanto sobra?',
  'Quanto posso gastar por dia até o fim do mês?',
  'Se continuar assim, quanto gasto no mês?',
  'Minhas metas',
];

export const AssistantScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const {
    transactions,
    categories,
    budgets,
    goals,
    recurring,
    installmentGroups,
    selectedMonthYear,
    monthlyIncome,
    monthlyExpense,
    monthlyBalance,
    currentBalance,
  } = useFinance();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'Olá! Sou seu Assistente Financeiro pessoal. Conheço todos os seus lançamentos, metas, parcelas e despesas fixas. Posso fazer cálculos exatos, comparar períodos, simular gastos futuros e responder qualquer dúvida sobre suas finanças.\n\nO que você gostaria de saber ou calcular agora?',
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [context, setContext] = useState<ConversationContext>({});
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  // Função auxiliar para extrair valor monetário de perguntas (ex: "gastar 50 reais", "R$ 150,00", "300")
  const extractAmountFromText = (text: string): number | null => {
    const match = text.match(/(?:r\$\s*|reais\s*|valor\s*de\s*|gastar\s*|pagar\s*|guardar\s*)?([\d]+(?:[\.,]\d{1,2})?)/i);
    if (!match) return null;
    const clean = match[1].replace(',', '.');
    const val = parseFloat(clean);
    return isNaN(val) ? null : val;
  };

  // ── MOTOR DE INTELIGÊNCIA FINANCEIRA CONTEXTUAL E MATEMÁTICA ──
  const processQuery = (userQuery: string, currentContext: ConversationContext): { reply: string; newContext: ConversationContext } => {
    const q = userQuery.toLowerCase().trim();
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentDay = now.getDate();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysRemainingInMonth = Math.max(1, daysInMonth - currentDay + 1);

    const prevMonthIdx = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const prevMonthPeriod = { month: prevMonthIdx, year: prevYear };

    // Despesas do mês passado
    const prevMonthExpense = transactions
      .filter((t) => t.type === 'expense' && isDateInMonthYear(t.date, prevMonthPeriod))
      .reduce((acc, t) => acc + t.amount, 0);

    const prevMonthIncome = transactions
      .filter((t) => t.type === 'income' && isDateInMonthYear(t.date, prevMonthPeriod))
      .reduce((acc, t) => acc + t.amount, 0);

    // ─────────────────────────────────────────────────────────────
    // 1. SIMULAÇÕES HIPOTÉTICAS: "Se eu gastar X agora, quanto sobra?"
    // ─────────────────────────────────────────────────────────────
    if (q.includes('se eu gastar') || q.includes('se gastar') || q.includes('se eu comprar') || q.includes('se comprar') || q.includes('quanto sobra se')) {
      const simVal = extractAmountFromText(q);
      if (simVal !== null && simVal > 0) {
        const newBalance = currentBalance - simVal;
        const newMonthlyBalance = monthlyBalance - simVal;
        return {
          reply: `Se você gastar **${formatCurrencyBRL(simVal)}** agora:\n\n` +
            `• **Cálculo do Saldo Geral:**\n` +
            `  ${formatCurrencyBRL(currentBalance)} - ${formatCurrencyBRL(simVal)} = **${formatCurrencyBRL(newBalance)}**\n\n` +
            `• **Cálculo da Economia do Mês:**\n` +
            `  ${formatCurrencyBRL(monthlyBalance)} - ${formatCurrencyBRL(simVal)} = **${formatCurrencyBRL(newMonthlyBalance)}**\n\n` +
            (newBalance >= 0
              ? `Você ainda continuará com um saldo positivo de ${formatCurrencyBRL(newBalance)}.`
              : `⚠️ Atenção: esse gasto deixará seu saldo acumulado negativo em ${formatCurrencyBRL(Math.abs(newBalance))}.`),
          newContext: { ...currentContext, lastAmount: simVal, lastTopic: 'balance' },
        };
      }
    }

    // ─────────────────────────────────────────────────────────────
    // 2. PROJEÇÃO: "Se continuar gastando assim, quanto vou gastar até o fim do mês?"
    // ─────────────────────────────────────────────────────────────
    if (q.includes('continuar gastando') || q.includes('projecao') || q.includes('projeção') || q.includes('estimativa de gastos') || q.includes('ate o final do mes') || q.includes('até o fim do mês')) {
      if (currentDay === 0 || monthlyExpense === 0) {
        return {
          reply: 'Ainda não há despesas suficientes registradas neste mês para projetar um padrão de gastos diários.',
          newContext: currentContext,
        };
      }

      const dailyAvg = monthlyExpense / currentDay;
      const projectedMonthTotal = dailyAvg * daysInMonth;

      return {
        reply: `📈 **Projeção de Gastos para o final do mês:**\n\n` +
          `• **Média diária atual (${currentDay} dias decorridos):**\n` +
          `  ${formatCurrencyBRL(monthlyExpense)} ÷ ${currentDay} dias = **${formatCurrencyBRL(dailyAvg)}/dia**\n\n` +
          `• **Estimativa até o final do mês (${daysInMonth} dias):**\n` +
          `  ${formatCurrencyBRL(dailyAvg)} × ${daysInMonth} dias = **${formatCurrencyBRL(projectedMonthTotal)}**\n\n` +
          (monthlyIncome > 0
            ? projectedMonthTotal <= monthlyIncome
              ? `✅ Pela estimativa, você terminará o mês com uma economia de aproximadamente **${formatCurrencyBRL(monthlyIncome - projectedMonthTotal)}**.`
              : `⚠️ Pelo ritmo atual, seus gastos projetados (${formatCurrencyBRL(projectedMonthTotal)}) vão ultrapassar suas receitas (${formatCurrencyBRL(monthlyIncome)}) em **${formatCurrencyBRL(projectedMonthTotal - monthlyIncome)}**.`
            : `💡 Dica: cadastre suas receitas no botão [+] para eu calcular se esse ritmo cabe no seu orçamento.`),
        newContext: currentContext,
      };
    }

    // ─────────────────────────────────────────────────────────────
    // 3. LIMITE DIÁRIO: "Quanto posso gastar hoje / por dia até o fim do mês?"
    // ─────────────────────────────────────────────────────────────
    if (q.includes('quanto posso gastar') || q.includes('gastar por dia') || q.includes('posso gastar hoje') || q.includes('limite diario') || q.includes('limite diário')) {
      const budgetBase = monthlyBalance > 0 ? monthlyBalance : currentBalance;

      if (budgetBase <= 0) {
        return {
          reply: `Atualmente seu saldo líquido disponível está zerado ou negativo (${formatCurrencyBRL(budgetBase)}). Recomendamos conter gastos adicionais neste mês para reequilibrar seu saldo.`,
          newContext: currentContext,
        };
      }

      const perDayAllowed = budgetBase / daysRemainingInMonth;

      return {
        reply: `🎯 **Seu Limite Diário Recomendado:**\n\n` +
          `Você pode gastar até **${formatCurrencyBRL(perDayAllowed)} por dia** nos próximos **${daysRemainingInMonth} dias** restantes de ${getMonthName(currentMonth)}.\n\n` +
          `• **Cálculo exato:**\n` +
          `  ${formatCurrencyBRL(budgetBase)} ÷ ${daysRemainingInMonth} dias = **${formatCurrencyBRL(perDayAllowed)}/dia**\n\n` +
          `Se você mantiver seus gastos abaixo desse valor a cada dia, encerrará o mês sem ficar no vermelho.`,
        newContext: currentContext,
      };
    }

    // ─────────────────────────────────────────────────────────────
    // 4. PANORAMA GERAL E SALDO
    // ─────────────────────────────────────────────────────────────
    if (q.includes('como est') || q.includes('minhas financas') || q.includes('minhas finanças') || q.includes('saldo') || q.includes('panorama') || q.includes('resumo')) {
      return {
        reply: `📊 **Panorama Financeiro Atual:**\n\n` +
          `• **Receitas do Mês:** ${formatCurrencyBRL(monthlyIncome)}\n` +
          `• **Despesas do Mês:** ${formatCurrencyBRL(monthlyExpense)}\n` +
          `• **Resultado Líquido do Mês:**\n` +
          `  ${formatCurrencyBRL(monthlyIncome)} - ${formatCurrencyBRL(monthlyExpense)} = **${formatCurrencyBRL(monthlyBalance)}**\n\n` +
          `• **Saldo Geral Acumulado:** **${formatCurrencyBRL(currentBalance)}**\n\n` +
          (monthlyBalance >= 0
            ? `Você está com as contas equilibradas e guardando dinheiro neste mês.`
            : `Suas saídas superaram os ganhos do mês em ${formatCurrencyBRL(Math.abs(monthlyBalance))}.`),
        newContext: { ...currentContext, lastTopic: 'balance' },
      };
    }

    // ─────────────────────────────────────────────────────────────
    // 5. ECONOMIA / QUANTO SOBROU
    // ─────────────────────────────────────────────────────────────
    if (q.includes('quanto economizei') || q.includes('quanto sobrou') || q.includes('economia') || q.includes('sobrou')) {
      const pct = monthlyIncome > 0 ? (monthlyBalance / monthlyIncome) * 100 : 0;
      if (monthlyBalance > 0) {
        return {
          reply: `Você economizou **${formatCurrencyBRL(monthlyBalance)}** este mês.\n\n` +
            `• **Cálculo da Taxa de Poupança:**\n` +
            `  (${formatCurrencyBRL(monthlyBalance)} ÷ ${formatCurrencyBRL(monthlyIncome)}) × 100 = **${pct.toFixed(1)}%** de tudo o que você ganhou foi economizado.`,
          newContext: { ...currentContext, lastTopic: 'balance' },
        };
      } else if (monthlyBalance === 0) {
        return {
          reply: `Neste mês suas entradas e saídas estão rigorosamente empatadas em **${formatCurrencyBRL(monthlyIncome)}** (R$ 0,00 de sobra).`,
          newContext: { ...currentContext, lastTopic: 'balance' },
        };
      } else {
        return {
          reply: `Neste mês não houve sobra financeira. Suas despesas superaram suas receitas em **${formatCurrencyBRL(Math.abs(monthlyBalance))}**.\n\n` +
            `• ${formatCurrencyBRL(monthlyIncome)} (entradas) - ${formatCurrencyBRL(monthlyExpense)} (saídas) = -${formatCurrencyBRL(Math.abs(monthlyBalance))}`,
          newContext: { ...currentContext, lastTopic: 'balance' },
        };
      }
    }

    // ─────────────────────────────────────────────────────────────
    // 6. CATEGORIAS: "Onde estou gastando mais?" / Consulta específica
    // ─────────────────────────────────────────────────────────────
    // Se o usuário mencionar uma categoria ou se estiver no contexto da conversa
    const matchedCategory = categories.find((c) => q.includes(c.name.toLowerCase())) ||
      (currentContext.lastCategoryId && (q === 'sim' || q.includes('analise') || q.includes('detalhe') || q.includes('mais'))
        ? categories.find((c) => c.id === currentContext.lastCategoryId)
        : undefined);

    if (matchedCategory) {
      const currentCatTotal = transactions
        .filter((t) => t.type === 'expense' && t.categoryId === matchedCategory.id && isDateInMonthYear(t.date, { month: currentMonth, year: currentYear }))
        .reduce((acc, t) => acc + t.amount, 0);

      const prevCatTotal = transactions
        .filter((t) => t.type === 'expense' && t.categoryId === matchedCategory.id && isDateInMonthYear(t.date, prevMonthPeriod))
        .reduce((acc, t) => acc + t.amount, 0);

      const catPctOfTotal = monthlyExpense > 0 ? ((currentCatTotal / monthlyExpense) * 100).toFixed(1) : '0';

      let reply = `🏷️ **Gastos na categoria ${matchedCategory.name}:**\n\n` +
        `• **Valor gasto este mês:** **${formatCurrencyBRL(currentCatTotal)}**\n` +
        `• **Participação no total de despesas:** **${catPctOfTotal}%** do que você gastou.\n`;

      if (prevCatTotal > 0) {
        const diff = currentCatTotal - prevCatTotal;
        const diffPct = ((diff / prevCatTotal) * 100).toFixed(1);
        reply += `\n• **Comparação com mês passado:**\n` +
          `  No mês anterior você gastou ${formatCurrencyBRL(prevCatTotal)}.\n` +
          `  ${diff >= 0 ? `Aumento de +${formatCurrencyBRL(diff)} (+${diffPct}%)` : `Redução de -${formatCurrencyBRL(Math.abs(diff))} (${diffPct}%)`}.`;
      }

      // Verifica se tem orçamento/limite
      const budget = budgets.find((b) => b.categoryId === matchedCategory.id);
      if (budget) {
        const budgetRemaining = budget.limitAmount - currentCatTotal;
        reply += `\n\n• **Limite do Orçamento (${formatCurrencyBRL(budget.limitAmount)}):**\n` +
          (budgetRemaining >= 0
            ? `  Você ainda pode gastar **${formatCurrencyBRL(budgetRemaining)}** dentro da meta.`
            : `  ⚠️ Você ultrapassou seu orçamento em **${formatCurrencyBRL(Math.abs(budgetRemaining))}**.`);
      }

      return {
        reply,
        newContext: {
          ...currentContext,
          lastTopic: 'category',
          lastCategoryId: matchedCategory.id,
          lastCategoryName: matchedCategory.name,
        },
      };
    }

    if (q.includes('onde estou gastando') || q.includes('maior gasto') || q.includes('maiores gastos') || q.includes('qual categoria')) {
      const byCat: Record<string, number> = {};
      const expenseTxs = transactions.filter((t) => t.type === 'expense' && isDateInMonthYear(t.date, { month: currentMonth, year: currentYear }));

      expenseTxs.forEach((t) => {
        byCat[t.categoryId] = (byCat[t.categoryId] || 0) + t.amount;
      });

      const sorted = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
      if (sorted.length === 0) {
        return {
          reply: 'Não há despesas cadastradas neste mês para listar as categorias.',
          newContext: currentContext,
        };
      }

      let reply = `🔍 **Suas maiores categorias de gastos em ${getMonthName(currentMonth)}:**\n\n`;
      sorted.slice(0, 4).forEach(([catId, val], idx) => {
        const cat = categories.find((c) => c.id === catId);
        const pct = monthlyExpense > 0 ? ((val / monthlyExpense) * 100).toFixed(1) : '0';
        reply += `${idx + 1}. **${cat?.name || 'Outros'}:** ${formatCurrencyBRL(val)} (${pct}% do total)\n`;
      });

      const topCat = categories.find((c) => c.id === sorted[0][0]);
      return {
        reply: reply + `\nVocê quer que eu faça uma análise detalhada da categoria **${topCat?.name}**?`,
        newContext: {
          ...currentContext,
          lastTopic: 'category',
          lastCategoryId: topCat?.id,
          lastCategoryName: topCat?.name,
        },
      };
    }

    // ─────────────────────────────────────────────────────────────
    // 7. COMPARAÇÃO: Este mês × Mês passado
    // ─────────────────────────────────────────────────────────────
    if (q.includes('compare') || q.includes('comparar') || q.includes('comparacao') || q.includes('comparação') || q.includes('mes passado') || q.includes('mês passado')) {
      if (prevMonthExpense === 0 && prevMonthIncome === 0) {
        return {
          reply: `Não existem registros suficientes no mês de ${getMonthName(prevMonthIdx)} para realizar a comparação com o mês atual.`,
          newContext: currentContext,
        };
      }

      const expDiff = monthlyExpense - prevMonthExpense;
      const expDiffPct = prevMonthExpense > 0 ? ((expDiff / prevMonthExpense) * 100).toFixed(1) : '0';

      const incDiff = monthlyIncome - prevMonthIncome;
      const incDiffPct = prevMonthIncome > 0 ? ((incDiff / prevMonthIncome) * 100).toFixed(1) : '0';

      return {
        reply: `⚖️ **Comparativo: ${getMonthName(prevMonthIdx)} × ${getMonthName(currentMonth)}:**\n\n` +
          `• **Despesas:**\n` +
          `  ${getMonthName(prevMonthIdx)}: ${formatCurrencyBRL(prevMonthExpense)}\n` +
          `  ${getMonthName(currentMonth)}: ${formatCurrencyBRL(monthlyExpense)}\n` +
          `  Diferença: **${expDiff >= 0 ? `+${formatCurrencyBRL(expDiff)} (+${expDiffPct}%)` : `-${formatCurrencyBRL(Math.abs(expDiff))} (${expDiffPct}%)`}**\n\n` +
          `• **Receitas:**\n` +
          `  ${getMonthName(prevMonthIdx)}: ${formatCurrencyBRL(prevMonthIncome)}\n` +
          `  ${getMonthName(currentMonth)}: ${formatCurrencyBRL(monthlyIncome)}\n` +
          `  Diferença: **${incDiff >= 0 ? `+${formatCurrencyBRL(incDiff)} (+${incDiffPct}%)` : `-${formatCurrencyBRL(Math.abs(incDiff))} (${incDiffPct}%)`}**\n\n` +
          (expDiff <= 0
            ? `👏 Parabéns! Seus gastos caíram em relação ao mês anterior.`
            : `💡 Seus gastos aumentaram neste mês. Vale a pena verificar as categorias que mais subiram.`),
        newContext: currentContext,
      };
    }

    // ─────────────────────────────────────────────────────────────
    // 8. METAS FINANCEIRAS
    // ─────────────────────────────────────────────────────────────
    if (q.includes('meta') || q.includes('metas') || q.includes('objetivo')) {
      if (goals.length === 0) {
        return {
          reply: 'Você ainda não possui nenhuma meta cadastrada. Você pode criar objetivos na aba **Metas** (ex: *Viagem*, *Carro*, *Reserva*) e eu calculo quanto você precisa poupar por mês!',
          newContext: currentContext,
        };
      }

      let reply = `🎯 **Progresso das suas Metas Financeiras:**\n\n`;
      goals.forEach((g) => {
        const remaining = Math.max(0, g.targetAmount - g.savedAmount);
        const pct = g.targetAmount > 0 ? ((g.savedAmount / g.targetAmount) * 100).toFixed(1) : '0';
        reply += `• **${g.name}:**\n` +
          `  Guardado: ${formatCurrencyBRL(g.savedAmount)} de ${formatCurrencyBRL(g.targetAmount)} (${pct}%)\n` +
          `  Falta guardar: **${formatCurrencyBRL(remaining)}**\n`;

        if (g.deadline) {
          const dl = new Date(g.deadline);
          const monthsLeft = Math.max(1, (dl.getFullYear() - currentYear) * 12 + (dl.getMonth() - currentMonth));
          const perMonth = remaining / monthsLeft;
          reply += `  Prazo: ${dl.toLocaleDateString('pt-BR')} (guardar **${formatCurrencyBRL(perMonth)}/mês**)\n`;
        }
        reply += `\n`;
      });

      return {
        reply,
        newContext: { ...currentContext, lastTopic: 'goal' },
      };
    }

    // ─────────────────────────────────────────────────────────────
    // 9. PARCELAS FUTURAS
    // ─────────────────────────────────────────────────────────────
    if (q.includes('parcela') || q.includes('parcelas') || q.includes('parcelado')) {
      const futureInstallments = transactions.filter(
        (t) => !!t.installmentGroupId && new Date(t.date) > now
      );
      const totalFuture = futureInstallments.reduce((acc, t) => acc + t.amount, 0);

      if (installmentGroups.length === 0) {
        return {
          reply: 'Você não possui compras parceladas cadastradas no momento. Ao cadastrar uma despesa, você pode marcar "Parcelado" para acompanhar o teto de compromissos futuros.',
          newContext: currentContext,
        };
      }

      return {
        reply: `💳 **Controle de Parcelas:**\n\n` +
          `• Você tem **${installmentGroups.length} compra(s) parcelada(s)** em andamento.\n` +
          `• Total futuro restante comprometido: **${formatCurrencyBRL(totalFuture)}**.\n` +
          `• Você pode visualizar a soma mês a mês detalhada na tela de **Parcelas**.`,
        newContext: { ...currentContext, lastTopic: 'installment' },
      };
    }

    // ─────────────────────────────────────────────────────────────
    // 10. GASTOS RECORRENTES / ASSINATURAS
    // ─────────────────────────────────────────────────────────────
    if (q.includes('recorrente') || q.includes('recorrentes') || q.includes('assinatura') || q.includes('fixa') || q.includes('fixas')) {
      const active = recurring.filter((r) => r.isActive);
      const totalRec = active.reduce((acc, r) => {
        if (r.frequency === 'weekly') return acc + r.amount * 4;
        if (r.frequency === 'biweekly') return acc + r.amount * 2;
        if (r.frequency === 'yearly') return acc + r.amount / 12;
        return acc + r.amount;
      }, 0);

      if (active.length === 0) {
        return {
          reply: 'Você não possui gastos recorrentes cadastrados ou ativos no momento.',
          newContext: currentContext,
        };
      }

      let reply = `🔄 **Suas Despesas Fixas e Recorrentes:**\n\n` +
        `• Total fixo estimado: **${formatCurrencyBRL(totalRec)}/mês**\n` +
        `• Quantidade ativa: **${active.length}** despesa(s)\n\n`;

      active.slice(0, 5).forEach((r) => {
        reply += `• ${r.name}: ${formatCurrencyBRL(r.amount)} (${r.frequency})\n`;
      });

      return {
        reply,
        newContext: { ...currentContext, lastTopic: 'recurring' },
      };
    }

    // ─────────────────────────────────────────────────────────────
    // RESPOSTA PADRÃO COM CONTEXTO FINANCEIRO
    // ─────────────────────────────────────────────────────────────
    return {
      reply: `Analisei seus registros atuais:\n\n` +
        `• **Saldo Geral:** ${formatCurrencyBRL(currentBalance)}\n` +
        `• **Ganhos no Mês:** ${formatCurrencyBRL(monthlyIncome)}\n` +
        `• **Gastos no Mês:** ${formatCurrencyBRL(monthlyExpense)}\n` +
        `• **Sobra Líquida:** ${formatCurrencyBRL(monthlyBalance)}\n\n` +
        `Você pode me pedir simulações como:\n` +
        `• *"Se eu gastar 80 reais hoje, quanto sobra?"*\n` +
        `• *"Quanto posso gastar por dia até o fim do mês?"*\n` +
        `• *"Onde estou gastando mais?"*\n` +
        `• *"Quanto falta para minha meta?"*`,
      newContext: currentContext,
    };
  };

  const handleSend = (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    const userMsg: Message = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText('');

    // Gera a resposta utilizando raciocínio e contexto
    setTimeout(() => {
      const { reply, newContext } = processQuery(text, context);
      setContext(newContext);

      const assistantMsg: Message = {
        id: `ast_${Date.now()}`,
        sender: 'assistant',
        text: reply,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    }, 200);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Lista de Mensagens */}
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.chatContainer}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((m) => {
            const isUser = m.sender === 'user';
            return (
              <View
                key={m.id}
                style={[
                  styles.msgWrapper,
                  isUser ? styles.msgWrapperUser : styles.msgWrapperAssistant,
                ]}
              >
                {!isUser && (
                  <View style={[styles.botAvatar, { backgroundColor: colors.primaryLight }]}>
                    <Ionicons name="sparkles" size={16} color={colors.primary} />
                  </View>
                )}
                <View
                  style={[
                    styles.msgBubble,
                    isUser
                      ? [styles.bubbleUser, { backgroundColor: colors.primary }]
                      : [styles.bubbleAssistant, { backgroundColor: colors.card, borderColor: colors.border }],
                  ]}
                >
                  <Text
                    style={[
                      styles.msgText,
                      { color: isUser ? '#FFFFFF' : colors.text },
                    ]}
                  >
                    {m.text}
                  </Text>
                </View>
              </View>
            );
          })}
        </ScrollView>

        {/* Sugestões Rápidas */}
        <View style={styles.suggestionsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {SUGGESTIONS.map((s, idx) => (
              <Pressable
                key={idx}
                onPress={() => handleSend(s)}
                style={[styles.sugChip, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <Text style={[styles.sugText, { color: colors.text }]}>{s}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Barra de Entrada */}
        <View style={[styles.inputBar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border },
            ]}
            placeholder="Pergunte sobre gastos, simulações, metas..."
            placeholderTextColor={colors.textSecondary}
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={() => handleSend()}
          />
          <Pressable
            onPress={() => handleSend()}
            style={[styles.sendBtn, { backgroundColor: colors.primary }]}
          >
            <Ionicons name="send" size={18} color="#FFFFFF" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  chatContainer: { padding: 16, paddingBottom: 20 },
  msgWrapper: {
    flexDirection: 'row',
    marginBottom: 14,
    alignItems: 'flex-end',
  },
  msgWrapperUser: {
    justifyContent: 'flex-end',
  },
  msgWrapperAssistant: {
    justifyContent: 'flex-start',
  },
  botAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  msgBubble: {
    maxWidth: '85%',
    padding: 14,
    borderRadius: 18,
  },
  bubbleUser: {
    borderBottomRightRadius: 4,
  },
  bubbleAssistant: {
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    elevation: 1,
  },
  msgText: {
    fontSize: 14,
    lineHeight: 21,
  },
  suggestionsContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  sugChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
  },
  sugText: {
    fontSize: 12,
    fontWeight: '600',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    paddingHorizontal: 14,
    borderTopWidth: 1,
    gap: 10,
  },
  input: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 14,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
