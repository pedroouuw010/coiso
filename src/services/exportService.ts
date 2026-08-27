import { Platform, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Transaction, Category, Budget } from '../@types';

export const exportService = {
  // Exportar para CSV
  async exportToCSV(transactions: Transaction[], categories: Category[]): Promise<boolean> {
    try {
      if (transactions.length === 0) {
        Alert.alert('Aviso', 'Não há transações para exportar.');
        return false;
      }

      const categoryMap = new Map(categories.map(c => [c.id, c.name]));

      // Cabeçalho CSV com UTF-8 BOM para abrir no Excel sem problemas de acentuação
      let csvContent = '\uFEFFData;Descrição;Categoria;Tipo;Valor (R$)\n';

      transactions.forEach(t => {
        const catName = categoryMap.get(t.categoryId) || 'Sem Categoria';
        const typeLabel = t.type === 'income' ? 'Receita' : 'Despesa';
        const formattedAmount = t.amount.toFixed(2).replace('.', ',');
        const sanitizedDesc = (t.description || 'Sem descrição').replace(/;/g, ',');

        csvContent += `${t.date};"${sanitizedDesc}";"${catName}";${typeLabel};${formattedAmount}\n`;
      });

      const fileName = `extrato_financeiro_${new Date().toISOString().slice(0, 10)}.csv`;

      if (Platform.OS === 'web') {
        // Fallback para navegador web
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return true;
      }

      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      await FileSystem.writeAsStringAsync(fileUri, csvContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: 'Exportar Extrato Financeiro (CSV)',
          UTI: 'public.comma-separated-values-text',
        });
        return true;
      } else {
        Alert.alert('Sucesso', `Arquivo salvo em: ${fileUri}`);
        return true;
      }
    } catch (error) {
      console.error('Erro ao exportar CSV:', error);
      Alert.alert('Erro', 'Não foi possível exportar os dados para CSV.');
      return false;
    }
  },

  // Exportar Backup Completo (JSON)
  async exportToJSON(
    transactions: Transaction[],
    categories: Category[],
    budgets: Budget[]
  ): Promise<boolean> {
    try {
      const backupData = {
        exportedAt: new Date().toISOString(),
        version: '1.0.0',
        transactions,
        categories,
        budgets,
      };

      const jsonContent = JSON.stringify(backupData, null, 2);
      const fileName = `backup_financeiro_${new Date().toISOString().slice(0, 10)}.json`;

      if (Platform.OS === 'web') {
        const blob = new Blob([jsonContent], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return true;
      }

      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      await FileSystem.writeAsStringAsync(fileUri, jsonContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: 'Exportar Backup Completo (JSON)',
          UTI: 'public.json',
        });
        return true;
      } else {
        Alert.alert('Sucesso', `Backup salvo em: ${fileUri}`);
        return true;
      }
    } catch (error) {
      console.error('Erro ao exportar JSON:', error);
      Alert.alert('Erro', 'Não foi possível gerar o backup JSON.');
      return false;
    }
  },
};
