import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import type { Account } from "@shared/schema";
import { Building, CreditCard, PiggyBank, University, Wallet, Plus, MoreVertical } from "lucide-react";

export default function Accounts() {
  const { data: accounts, isLoading } = useQuery<Account[]>({
    queryKey: ["/api/accounts"],
  });

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-96">Loading...</div>;
  }

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'checking':
        return University;
      case 'savings':
        return PiggyBank;
      case 'credit':
        return CreditCard;
      default:
        return Wallet;
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

  const getAccountTypeLabel = (type: string) => {
    switch (type) {
      case 'checking':
        return 'Checking Account';
      case 'savings':
        return 'Savings Account';
      case 'credit':
        return 'Credit Account';
      default:
        return 'Account';
    }
  };

  const totalBalance = accounts?.reduce((sum, account) => sum + parseFloat(account.balance), 0) || 0;
  const checkingBalance = accounts?.filter(acc => acc.type === 'checking')
    .reduce((sum, account) => sum + parseFloat(account.balance), 0) || 0;
  const savingsBalance = accounts?.filter(acc => acc.type === 'savings')
    .reduce((sum, account) => sum + parseFloat(account.balance), 0) || 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Bank Accounts</h2>
        <p className="text-gray-600">Manage your bank accounts and view detailed information</p>
      </div>

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {accounts?.map((account) => {
          const IconComponent = getAccountIcon(account.type);
          
          return (
            <Card key={account.id} className="p-6">
              <CardContent className="p-0">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getAccountColor(account.type)}`}>
                      <IconComponent className="text-lg" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{account.name}</h3>
                      <p className="text-sm text-gray-500">{getAccountTypeLabel(account.type)}</p>
                    </div>
                  </div>
                  <button className="text-gray-400 hover:text-gray-600">
                    <MoreVertical size={20} />
                  </button>
                </div>
                
                <div className="mb-4">
                  <p className="text-sm text-gray-500 mb-1">Account Number</p>
                  <p className="font-medium text-gray-900">{account.accountNumber}</p>
                </div>
                
                <div className="mb-6">
                  <p className="text-sm text-gray-500 mb-1">Current Balance</p>
                  <p className="text-3xl font-bold text-gray-900">{formatCurrency(account.balance)}</p>
                </div>
                
                <div className="flex space-x-3">
                  <Button className="flex-1" size="sm">
                    View Transactions
                  </Button>
                  <Button variant="outline" className="flex-1" size="sm">
                    Update Balance
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {/* Add New Account Card */}
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:border-gray-400 transition-colors cursor-pointer">
          <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center mb-4">
            <Plus className="text-gray-400 text-lg" />
          </div>
          <h3 className="text-lg font-medium text-gray-600 mb-2">Add New Account</h3>
          <p className="text-sm text-gray-500">Connect another bank account to track</p>
        </div>
      </div>

      {/* Account Summary */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Account Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-2">Total Accounts</p>
            <p className="text-2xl font-bold text-gray-900">{accounts?.length || 0}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-2">Total Balance</p>
            <p className="text-2xl font-bold text-secondary">{formatCurrency(totalBalance)}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-2">Checking Accounts</p>
            <p className="text-2xl font-bold text-primary">{formatCurrency(checkingBalance)}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-2">Savings Accounts</p>
            <p className="text-2xl font-bold text-warning">{formatCurrency(savingsBalance)}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
