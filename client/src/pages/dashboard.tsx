import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowUp, ArrowDown, ChartLine, TrendingUp, TrendingDown, ArrowUpDown } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Account } from "@shared/schema";

interface DashboardSummary {
  monthlyIncome: string;
  monthlyExpenses: string;
  netIncome: string;
  totalBalance: string;
  currentMonth: string;
}

interface RecentTransaction {
  id: number;
  date: string;
  amount: string;
  description?: string;
  type: 'income' | 'expense' | 'transfer';
  account?: string;
  fromAccount?: string;
  toAccount?: string;
  source?: string;
  category?: string;
}

export default function Dashboard() {
  const { data: summary, isLoading: summaryLoading } = useQuery<DashboardSummary>({
    queryKey: ["/api/dashboard/summary"],
  });

  const { data: accounts, isLoading: accountsLoading } = useQuery<Account[]>({
    queryKey: ["/api/accounts"],
  });

  const { data: recentTransactions, isLoading: transactionsLoading } = useQuery<RecentTransaction[]>({
    queryKey: ["/api/dashboard/recent-transactions"],
  });

  if (summaryLoading || accountsLoading || transactionsLoading) {
    return <div className="flex items-center justify-center min-h-96">Loading...</div>;
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'income':
        return <ArrowUp className="text-secondary" />;
      case 'expense':
        return <ArrowDown className="text-danger" />;
      case 'transfer':
        return <ArrowUpDown className="text-primary" />;
      default:
        return <ChartLine className="text-gray-500" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'income':
        return 'text-secondary';
      case 'expense':
        return 'text-danger';
      case 'transfer':
        return 'text-primary';
      default:
        return 'text-gray-500';
    }
  };

  const formatTransactionAmount = (amount: string, type: string) => {
    const prefix = type === 'income' ? '+' : type === 'expense' ? '-' : '';
    return `${prefix}${formatCurrency(amount)}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Section */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Financial Dashboard</h2>
        <p className="text-gray-600">
          Overview of your financial status for{" "}
          <span className="font-medium">{summary?.currentMonth}</span>
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Income Card */}
        <Card className="p-6">
          <CardContent className="p-0">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                <ArrowUp className="text-secondary text-xl" />
              </div>
              <span className="text-sm text-gray-500">This Month</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {formatCurrency(summary?.monthlyIncome || "0")}
            </h3>
            <p className="text-sm text-secondary">Total Income</p>
            <div className="mt-3 flex items-center text-sm">
              <TrendingUp className="text-secondary text-xs mr-1" />
              <span className="text-secondary">12% from last month</span>
            </div>
          </CardContent>
        </Card>

        {/* Expenses Card */}
        <Card className="p-6">
          <CardContent className="p-0">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-danger/10 rounded-lg flex items-center justify-center">
                <ArrowDown className="text-danger text-xl" />
              </div>
              <span className="text-sm text-gray-500">This Month</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {formatCurrency(summary?.monthlyExpenses || "0")}
            </h3>
            <p className="text-sm text-danger">Total Expenses</p>
            <div className="mt-3 flex items-center text-sm">
              <TrendingDown className="text-danger text-xs mr-1" />
              <span className="text-danger">8% from last month</span>
            </div>
          </CardContent>
        </Card>

        {/* Net Income Card */}
        <Card className="p-6">
          <CardContent className="p-0">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <ChartLine className="text-primary text-xl" />
              </div>
              <span className="text-sm text-gray-500">Net Income</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {formatCurrency(summary?.netIncome || "0")}
            </h3>
            <p className="text-sm text-gray-600">Income - Expenses</p>
            <div className="mt-3 flex items-center text-sm">
              <TrendingUp className="text-secondary text-xs mr-1" />
              <span className="text-secondary">18% from last month</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bank Accounts Overview */}
      <Card className="mb-8">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Bank Accounts</h3>
          <p className="text-sm text-gray-600 mt-1">Current balances across all your accounts</p>
        </div>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts?.map((account) => {
              const getAccountIcon = (type: string) => {
                switch (type) {
                  case 'checking':
                    return "fas fa-university";
                  case 'savings':
                    return "fas fa-piggy-bank";
                  case 'credit':
                    return "fas fa-credit-card";
                  default:
                    return "fas fa-wallet";
                }
              };

              const getAccountColor = (type: string) => {
                switch (type) {
                  case 'checking':
                    return 'bg-primary/10 text-primary';
                  case 'savings':
                    return 'bg-secondary/10 text-secondary';
                  case 'credit':
                    return 'bg-warning/10 text-warning';
                  default:
                    return 'bg-purple-100 text-purple-600';
                }
              };

              return (
                <div
                  key={account.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getAccountColor(account.type)}`}>
                        <i className={getAccountIcon(account.type)}></i>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{account.name}</h4>
                        <p className="text-sm text-gray-500">{account.accountNumber}</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(account.balance)}</p>
                </div>
              );
            })}
          </div>
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-lg font-medium text-gray-900">Total Balance</span>
              <span className="text-2xl font-bold text-gray-900">
                {formatCurrency(summary?.totalBalance || "0")}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
              <p className="text-sm text-gray-600 mt-1">Your latest financial activities</p>
            </div>
            <button className="text-primary hover:text-primary/80 text-sm font-medium">View All</button>
          </div>
        </div>
        <CardContent className="p-6">
          <div className="space-y-4">
            {recentTransactions?.map((transaction) => (
              <div
                key={`${transaction.type}-${transaction.id}`}
                className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-opacity-10 rounded-lg flex items-center justify-center">
                    {getTransactionIcon(transaction.type)}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {transaction.description || 
                       (transaction.type === 'transfer' ? 'Bank Transfer' : 'Transaction')}
                    </h4>
                    <p className="text-sm text-gray-500">{formatDate(transaction.date)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${getTransactionColor(transaction.type)}`}>
                    {formatTransactionAmount(transaction.amount, transaction.type)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {transaction.type === 'transfer' 
                      ? `${transaction.fromAccount} → ${transaction.toAccount}`
                      : transaction.account}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
