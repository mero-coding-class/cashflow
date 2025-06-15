import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency, formatDate, getCurrentMonth } from "@/lib/utils";
import { insertExpenseSchema } from "@shared/schema";
import type { Account, Expense } from "@shared/schema";
import { ArrowDown, Minus } from "lucide-react";
import { z } from "zod";

const expenseFormSchema = insertExpenseSchema.extend({
  date: z.string().min(1, "Date is required"),
  amount: z.string().min(1, "Amount is required"),
  category: z.string().min(1, "Category is required"),
  accountId: z.string().min(1, "Account is required"),
});

type ExpenseFormData = z.infer<typeof expenseFormSchema>;

const expenseCategoryOptions = [
  { value: "food", label: "Food & Dining", icon: "fas fa-utensils" },
  { value: "utilities", label: "Utilities", icon: "fas fa-bolt" },
  { value: "transportation", label: "Transportation", icon: "fas fa-car" },
  { value: "entertainment", label: "Entertainment", icon: "fas fa-film" },
  { value: "shopping", label: "Shopping", icon: "fas fa-shopping-bag" },
  { value: "healthcare", label: "Healthcare", icon: "fas fa-heartbeat" },
  { value: "education", label: "Education", icon: "fas fa-graduation-cap" },
  { value: "housing", label: "Housing", icon: "fas fa-home" },
  { value: "insurance", label: "Insurance", icon: "fas fa-shield-alt" },
  { value: "other", label: "Other", icon: "fas fa-question" },
];

export default function Expenses() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: accounts } = useQuery<Account[]>({
    queryKey: ["/api/accounts"],
  });

  const { data: expenseTransactions, isLoading } = useQuery<Expense[]>({
    queryKey: ["/api/expenses"],
  });

  const { data: monthlyExpenses } = useQuery<Expense[]>({
    queryKey: ["/api/expenses/month", getCurrentMonth()],
  });

  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      amount: "",
      category: "",
      accountId: "",
      description: "",
    },
  });

  const createExpenseMutation = useMutation({
    mutationFn: async (data: ExpenseFormData) => {
      const submitData = {
        ...data,
        accountId: parseInt(data.accountId),
      };
      return apiRequest("POST", "/api/expenses", submitData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/recent-transactions"] });
      form.reset({
        date: new Date().toISOString().split('T')[0],
        amount: "",
        category: "",
        accountId: "",
        description: "",
      });
      toast({
        title: "Success",
        description: "Expense recorded successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to record expense. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ExpenseFormData) => {
    createExpenseMutation.mutate(data);
  };

  const getAccountName = (accountId: number) => {
    return accounts?.find(acc => acc.id === accountId)?.name || "Unknown Account";
  };

  const getCategoryIcon = (category: string) => {
    const option = expenseCategoryOptions.find(opt => opt.value === category);
    return option?.icon || "fas fa-question";
  };

  const getCategoryLabel = (category: string) => {
    const option = expenseCategoryOptions.find(opt => opt.value === category);
    return option?.label || category;
  };

  // Calculate category breakdown for current month
  const categoryBreakdown = monthlyExpenses?.reduce((acc, expense) => {
    const category = expense.category;
    if (!acc[category]) {
      acc[category] = 0;
    }
    acc[category] += parseFloat(expense.amount);
    return acc;
  }, {} as Record<string, number>) || {};

  const sortedCategories = Object.entries(categoryBreakdown)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Record Expenses</h2>
        <p className="text-gray-600">Track your spending and categorize your expenses</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Expense Form */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Add New Expense</h3>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-gray-500">$</span>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          className="pl-8"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {expenseCategoryOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="accountId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bank Account</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select account" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {accounts?.map((account) => (
                          <SelectItem key={account.id} value={account.id.toString()}>
                            {account.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder="Optional description..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                variant="destructive"
                className="w-full"
                disabled={createExpenseMutation.isPending}
              >
                <Minus className="mr-2 h-4 w-4" />
                Record Expense
              </Button>
            </form>
          </Form>
        </Card>

        {/* Expense Categories Summary */}
        <div className="space-y-6">
          {/* Recent Expenses */}
          <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Recent Expenses</h3>
              <button className="text-primary hover:text-primary/80 text-sm font-medium">View All</button>
            </div>
            <div className="space-y-4">
              {isLoading ? (
                <div className="text-center py-8">Loading...</div>
              ) : expenseTransactions?.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No expense transactions yet</div>
              ) : (
                expenseTransactions?.slice(0, 5).map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-danger/10 rounded-lg flex items-center justify-center">
                        <i className={`${getCategoryIcon(transaction.category)} text-danger text-sm`}></i>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {transaction.description || "Expense Transaction"}
                        </h4>
                        <p className="text-sm text-gray-500">{formatDate(transaction.date)}</p>
                        <p className="text-xs text-gray-400">{getCategoryLabel(transaction.category)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-danger">
                        -{formatCurrency(transaction.amount)}
                      </p>
                      <p className="text-xs text-gray-500">{getAccountName(transaction.accountId)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Category Breakdown */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">This Month's Categories</h3>
            <div className="space-y-4">
              {sortedCategories.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No expenses this month</div>
              ) : (
                sortedCategories.map(([category, amount]) => {
                  const colors = [
                    'bg-blue-100 text-blue-600',
                    'bg-green-100 text-green-600',
                    'bg-yellow-100 text-yellow-600',
                    'bg-purple-100 text-purple-600',
                    'bg-red-100 text-red-600',
                  ];
                  const colorIndex = expenseCategoryOptions.findIndex(opt => opt.value === category) % colors.length;
                  
                  return (
                    <div key={category} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colors[colorIndex]}`}>
                          <i className={`${getCategoryIcon(category)} text-sm`}></i>
                        </div>
                        <span className="font-medium text-gray-900">{getCategoryLabel(category)}</span>
                      </div>
                      <span className="font-semibold text-gray-900">{formatCurrency(amount)}</span>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
