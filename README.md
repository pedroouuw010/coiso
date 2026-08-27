# 💰 Aplicativo de Controle Financeiro Pessoal (React Native + Expo)

Aplicativo completo de gestão financeira pessoal, desenvolvido com **React Native**, **Expo**, **TypeScript** e **AsyncStorage** para persistência 100% local e offline-first.

---

## 🚀 Como Rodar o Projeto

### 1. Pré-requisitos
- Node.js instalado (versão 18 ou superior).
- Expo Go instalado no seu smartphone (Android/iOS) ou um emulador configurado.

### 2. Instalação das Dependências
Navegue até a pasta do projeto e instale as dependências:

```bash
cd finance-app
npm install
```

Ou se estiver criando um projeto Expo novo do zero, execute:

```bash
npx create-expo-app finance-app --template blank-typescript
cd finance-app
npx expo install @react-navigation/native @react-navigation/bottom-tabs @react-navigation/native-stack react-native-screens react-native-safe-area-context @react-native-async-storage/async-storage @expo/vector-icons expo-file-system expo-sharing
```

### 3. Iniciar o Aplicativo
Execute o servidor de desenvolvimento do Expo:

```bash
npx expo start
```

- **Android:** Pressione `a` no terminal ou escaneie o QR Code no app **Expo Go**.
- **iOS:** Pressione `i` no terminal ou escaneie o QR Code com a câmera (iOS).
- **Web:** Pressione `w` no terminal para rodar no navegador.

---

## 📱 Principais Funcionalidades

1. **Dashboard Inicial:**
   - Resumo dinâmico: Saldo Geral, Entradas do Mês e Saídas do Mês.
   - Lista das 5 transações mais recentes com atalhos de edição e exclusão.
   - Botões de acesso rápido para criar nova receita ou despesa.

2. **Histórico Completo (Extrato):**
   - Seletor de período com paginação mensal (`< Agosto 2026 >`).
   - Barra de pesquisa por descrição ou categoria.
   - Filtros instantâneos: *Todos*, *Despesas* e *Receitas*.

3. **Registro Rápido em 3 Cliques:**
   - Botão central `[+]` flutuante em destaque na barra inferior.
   - Modal com seleção de Tipo, Valor (R$), Categoria e Data/Descrição.

4. **Planejamento e Orçamentos com Alerta Visual:**
   - Definição de teto de gastos por categoria.
   - Barra de progresso com transição de cores inteligente:
     - 🟢 **Verde:** Gastos abaixo de 70% do teto.
     - 🟡 **Amarelo:** Gastos entre 70% e 99% (atenção).
     - 🔴 **Vermelho:** Teto atingido ou estourado (>= 100%).

5. **Gerenciador de Categorias:**
   - Categorias padrão integradas (Alimentação, Transporte, Moradia, Saúde, Lazer, Salário, Educação, Investimentos, etc.).
   - Criação de novas categorias personalizadas com paleta de cores e seleção de ícones Ionicons.

6. **Ajustes & Backup:**
   - Alternador de Tema Claro e Escuro (**Dark Mode**).
   - Exportação do extrato para **CSV** formatado para Excel/Sheets.
   - Backup completo dos dados em formato **JSON**.
