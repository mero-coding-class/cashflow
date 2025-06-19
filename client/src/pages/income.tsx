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
import { formatCurrency, formatDate } from "@/lib/utils";
import { insertIncomeSchema } from "@shared/schema";
import type { Account, Income } from "@shared/schema";
import { ArrowUp, Plus } from "lucide-react";
import { z } from "zod";


const incomeFormSchema = insertIncomeSchema.extend({
  date: z.string().min(1, "Date is required"),
  amount: z.string().min(1, "Amount is required"),
  source: z.string().min(1, "Source is required"),
  accountId: z.string().min(1, "Account is required"),
});

type IncomeFormData = z.infer<typeof incomeFormSchema>;

const incomeSourceOptions = [
  { value: "salary", label: "Salary" },
  { value: "freelance", label: "Freelance" },
  { value: "business", label: "Business" },
  { value: "investment", label: "Investment" },
  { value: "rental", label: "Rental Income" },
  { value: "other", label: "Other" },
];

export default function Income() {
  const [showAll, setShowAll] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: accounts } = useQuery<Account[]>({
    queryKey: ["/api/accounts"],
  });

  const { data: incomeTransactions, isLoading } = useQuery<Income[]>({
    queryKey: ["/api/income"],
  });

  const form = useForm<IncomeFormData>({
    resolver: zodResolver(incomeFormSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      amount: "",
      source: "",
      accountId: "",
      description: "",
    },
  });

  const createIncomeMutation = useMutation({
    mutationFn: async (data: IncomeFormData) => {
      const submitData = {
        ...data,
        accountId: parseInt(data.accountId),
      };
      return apiRequest("POST", "/api/income", submitData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/income"] });
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/recent-transactions"] });
      form.reset({
        date: new Date().toISOString().split('T')[0],
        amount: "",
        source: "",
        accountId: "",
        description: "",
      });
      toast({
        title: "Success",
        description: "Income recorded successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to record income. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: IncomeFormData) => {
    createIncomeMutation.mutate(data);
  };

  const getAccountName = (accountId: number) => {
    return accounts?.find(acc => acc.id === accountId)?.name || "Unknown Account";
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Record Income</h2>
        <p className="text-gray-600">Add your income transactions and track your earnings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Income Form */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Add New Income</h3>
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
                name="source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Source</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select income source" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {incomeSourceOptions.map((option) => (
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
                      value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={createIncomeMutation.isPending}
              >
                <Plus className="mr-2 h-4 w-4" />
                Record Income
              </Button>
            </form>
          </Form>
        </Card>

        {/* Income History */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Recent Income</h3>
            <button
              className="text-primary hover:text-primary/80 text-sm font-medium"
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? "Show Less" : "View All"}
            </button>

          </div>
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8">Loading...</div>
            ) : (incomeTransactions?.length ?? 0) === 0 ? (
              <div className="text-center py-8 text-gray-500">No income transactions yet</div>
            ) : (
              (showAll ? incomeTransactions ?? [] : incomeTransactions?.slice(0, 10) ?? []).map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-secondary/10 rounded-lg flex items-center justify-center">
                      <ArrowUp className="text-secondary text-sm" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {transaction.description || "Income Transaction"}
                      </h4>
                      <p className="text-sm text-gray-500">{formatDate(transaction.date)}</p>
                      <p className="text-xs text-gray-400 capitalize">{transaction.source}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-secondary">
                      +{formatCurrency(transaction.amount)}
                    </p>
                    <p className="text-xs text-gray-500">{getAccountName(transaction.accountId)}</p>
                  </div>
                </div>
              ))
            )}


          </div>
        </Card>
      </div>
    </div>
  );
}
