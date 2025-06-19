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
import { insertTransferSchema } from "@shared/schema";
import type { Account, Transfer } from "@shared/schema";
import { ArrowUpDown, ArrowRight } from "lucide-react";
import { z } from "zod";

const transferFormSchema = insertTransferSchema.extend({
  date: z.string().min(1, "Date is required"),
  amount: z.string().min(1, "Amount is required"),
  fromAccountId: z.string().min(1, "From account is required"),
  toAccountId: z.string().min(1, "To account is required"),
}).refine((data) => data.fromAccountId !== data.toAccountId, {
  message: "Cannot transfer to the same account",
  path: ["toAccountId"],
});

type TransferFormData = z.infer<typeof transferFormSchema>;

export default function Transfers() {
  const [showAll, setShowAll] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: accounts } = useQuery<Account[]>({
    queryKey: ["/api/accounts"],
  });

  const { data: transferTransactions, isLoading } = useQuery<Transfer[]>({
    queryKey: ["/api/transfers"],
  });

  const form = useForm<TransferFormData>({
    resolver: zodResolver(transferFormSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      amount: "",
      fromAccountId: "",
      toAccountId: "",
      description: "",
    },
  });

  const createTransferMutation = useMutation({
    mutationFn: async (data: TransferFormData) => {
      const submitData = {
        ...data,
        fromAccountId: parseInt(data.fromAccountId),
        toAccountId: parseInt(data.toAccountId),
      };
      return apiRequest("POST", "/api/transfers", submitData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transfers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/recent-transactions"] });
      form.reset({
        date: new Date().toISOString().split('T')[0],
        amount: "",
        fromAccountId: "",
        toAccountId: "",
        description: "",
      });
      toast({
        title: "Success",
        description: "Transfer recorded successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to record transfer. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: TransferFormData) => {
    createTransferMutation.mutate(data);
  };

  const getAccountName = (accountId: number) => {
    return accounts?.find(acc => acc.id === accountId)?.name || "Unknown Account";
  };

  // Get available accounts for "To" field based on "From" selection
  const selectedFromAccount = form.watch("fromAccountId");
  const availableToAccounts = accounts?.filter(acc => acc.id.toString() !== selectedFromAccount) || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Bank Transfers</h2>
        <p className="text-gray-600">Record transfers between your bank accounts</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Transfer Form */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Record New Transfer</h3>
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
                name="fromAccountId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>From Account</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select source account" />
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
                name="toAccountId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>To Account</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select destination account" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableToAccounts.map((account) => (
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
                className="w-full"
                disabled={createTransferMutation.isPending}
              >
                <ArrowUpDown className="mr-2 h-4 w-4" />
                Record Transfer
              </Button>
            </form>
          </Form>
        </Card>

        {/* Transfer History */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Recent Transfers</h3>
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
            ) : transferTransactions?.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No transfer transactions yet</div>
            ) : (
              transferTransactions?.slice(0, 10).map((transaction) => (
                <div key={transaction.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                        <ArrowUpDown className="text-primary text-sm" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {transaction.description || "Bank Transfer"}
                        </h4>
                        <p className="text-sm text-gray-500">{formatDate(transaction.date)}</p>
                      </div>
                    </div>
                    <span className="font-semibold text-primary">
                      {formatCurrency(transaction.amount)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-500">From:</span>
                      <span className="font-medium text-gray-700">
                        {getAccountName(transaction.fromAccountId)}
                      </span>
                    </div>
                    <ArrowRight className="text-gray-400" size={16} />
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-500">To:</span>
                      <span className="font-medium text-gray-700">
                        {getAccountName(transaction.toAccountId)}
                      </span>
                    </div>
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
