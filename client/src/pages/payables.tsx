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
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency, formatDate } from "@/lib/utils";
import { insertPayableSchema } from "@shared/schema";
import type { Payable } from "@shared/schema";
import { TrendingDown, Plus, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import { z } from "zod";

const payableFormSchema = insertPayableSchema.extend({
  date: z.string().min(1, "Date is required"),
  amount: z.string().min(1, "Amount is required"),
  vendorName: z.string().min(1, "Vendor name is required"),
  dueDate: z.string().min(1, "Due date is required"),
});

type PayableFormData = z.infer<typeof payableFormSchema>;

export default function Payables() {
  const [showAll, setShowAll] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: payables, isLoading } = useQuery<Payable[]>({
    queryKey: ["/api/payables"],
  });

  const form = useForm<PayableFormData>({
    resolver: zodResolver(payableFormSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      amount: "",
      vendorName: "",
      description: "",
      dueDate: "",
      status: "pending",
    },
  });

  const createPayableMutation = useMutation({
    mutationFn: async (data: PayableFormData) => {
      return apiRequest("POST", "/api/payables", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payables"] });
      form.reset({
        date: new Date().toISOString().split('T')[0],
        amount: "",
        vendorName: "",
        description: "",
        dueDate: "",
        status: "pending",
      });
      toast({
        title: "Success",
        description: "Payable recorded successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to record payable. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return apiRequest("PATCH", `/api/payables/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payables"] });
      toast({
        title: "Success",
        description: "Status updated successfully!",
      });
    },
  });

  const onSubmit = (data: PayableFormData) => {
    createPayableMutation.mutate(data);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="text-secondary" size={16} />;
      case 'overdue':
        return <AlertTriangle className="text-danger" size={16} />;
      default:
        return <Clock className="text-warning" size={16} />;
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'paid':
        return 'secondary';
      case 'overdue':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const totalPayables = payables?.reduce((sum, payable) => sum + parseFloat(payable.amount), 0) || 0;
  const pendingPayables = payables?.filter(p => p.status === 'pending').reduce((sum, payable) => sum + parseFloat(payable.amount), 0) || 0;
  const overduePayables = payables?.filter(p => p.status === 'overdue').reduce((sum, payable) => sum + parseFloat(payable.amount), 0) || 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Accounts Payable</h2>
        <p className="text-gray-600">Track money you owe to vendors and suppliers</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="p-6">
          <CardContent className="p-0">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-danger/10 rounded-lg flex items-center justify-center">
                <TrendingDown className="text-danger text-xl" />
              </div>
              <span className="text-sm text-gray-500">Total</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {formatCurrency(totalPayables)}
            </h3>
            <p className="text-sm text-gray-600">Total Payables</p>
          </CardContent>
        </Card>

        <Card className="p-6">
          <CardContent className="p-0">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
                <Clock className="text-warning text-xl" />
              </div>
              <span className="text-sm text-gray-500">Pending</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {formatCurrency(pendingPayables)}
            </h3>
            <p className="text-sm text-warning">Awaiting Payment</p>
          </CardContent>
        </Card>

        <Card className="p-6">
          <CardContent className="p-0">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-danger/10 rounded-lg flex items-center justify-center">
                <AlertTriangle className="text-danger text-xl" />
              </div>
              <span className="text-sm text-gray-500">Overdue</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {formatCurrency(overduePayables)}
            </h3>
            <p className="text-sm text-danger">Past Due Date</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Payable Form */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Add New Payable</h3>
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
                name="vendorName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vendor Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter vendor name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
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
                disabled={createPayableMutation.isPending}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Payable
              </Button>
            </form>
          </Form>
        </Card>

        {/* Payables List */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Payables List</h3>
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
            ) : payables?.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No payables yet</div>
            ) : (
              payables?.map((payable) => (
                <div key={payable.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-danger/10 rounded-lg flex items-center justify-center">
                        {getStatusIcon(payable.status)}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{payable.vendorName}</h4>
                        <p className="text-sm text-gray-500">Due: {formatDate(payable.dueDate)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">-{formatCurrency(payable.amount)}</p>
                      <Badge variant={getStatusVariant(payable.status)} className="text-xs">
                        {payable.status.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                  {payable.description && (
                    <p className="text-sm text-gray-600 mb-3">{payable.description}</p>
                  )}
                  <div className="flex space-x-2">
                    {payable.status === 'pending' && (
                      <>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => updateStatusMutation.mutate({ id: payable.id, status: 'paid' })}
                          disabled={updateStatusMutation.isPending}
                        >
                          Mark Paid
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => updateStatusMutation.mutate({ id: payable.id, status: 'overdue' })}
                          disabled={updateStatusMutation.isPending}
                        >
                          Mark Overdue
                        </Button>
                      </>
                    )}
                    {payable.status === 'overdue' && (
                      <Button 
                        size="sm"
                        onClick={() => updateStatusMutation.mutate({ id: payable.id, status: 'paid' })}
                        disabled={updateStatusMutation.isPending}
                      >
                        Mark Paid
                      </Button>
                    )}
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