import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertIncomeSchema, insertExpenseSchema, insertTransferSchema, insertReceivableSchema, insertPayableSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Accounts routes
  app.get("/api/accounts", async (req, res) => {
    try {
      const accounts = await storage.getAccounts();
      res.json(accounts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch accounts" });
    }
  });

  app.get("/api/accounts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const account = await storage.getAccount(id);
      if (!account) {
        return res.status(404).json({ message: "Account not found" });
      }
      res.json(account);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch account" });
    }
  });

  // Income routes
  app.get("/api/income", async (req, res) => {
    try {
      const income = await storage.getIncomeTransactions();
      res.json(income);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch income transactions" });
    }
  });

  app.get("/api/income/month/:month", async (req, res) => {
    try {
      const month = req.params.month;
      const income = await storage.getIncomeByMonth(month);
      res.json(income);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch monthly income" });
    }
  });

  app.post("/api/income", async (req, res) => {
    try {
      const validatedData = insertIncomeSchema.parse(req.body);
      const income = await storage.createIncome(validatedData);
      res.status(201).json(income);
    } catch (error) {
      res.status(400).json({ message: "Invalid income data", error });
    }
  });

  // Expense routes
  app.get("/api/expenses", async (req, res) => {
    try {
      const expenses = await storage.getExpenseTransactions();
      res.json(expenses);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch expense transactions" });
    }
  });

  app.get("/api/expenses/month/:month", async (req, res) => {
    try {
      const month = req.params.month;
      const expenses = await storage.getExpensesByMonth(month);
      res.json(expenses);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch monthly expenses" });
    }
  });

  app.post("/api/expenses", async (req, res) => {
    try {
      const validatedData = insertExpenseSchema.parse(req.body);
      const expense = await storage.createExpense(validatedData);
      res.status(201).json(expense);
    } catch (error) {
      res.status(400).json({ message: "Invalid expense data", error });
    }
  });

  // Transfer routes
  app.get("/api/transfers", async (req, res) => {
    try {
      const transfers = await storage.getTransferTransactions();
      res.json(transfers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch transfer transactions" });
    }
  });

  app.post("/api/transfers", async (req, res) => {
    try {
      const validatedData = insertTransferSchema.parse(req.body);
      if (validatedData.fromAccountId === validatedData.toAccountId) {
        return res.status(400).json({ message: "Cannot transfer to the same account" });
      }
      const transfer = await storage.createTransfer(validatedData);
      res.status(201).json(transfer);
    } catch (error) {
      res.status(400).json({ message: "Invalid transfer data", error });
    }
  });

  // Dashboard summary routes
  app.get("/api/dashboard/summary", async (req, res) => {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
      
      const [accounts, monthlyIncome, monthlyExpenses] = await Promise.all([
        storage.getAccounts(),
        storage.getIncomeByMonth(currentMonth),
        storage.getExpensesByMonth(currentMonth)
      ]);

      const totalIncome = monthlyIncome.reduce((sum, income) => sum + parseFloat(income.amount), 0);
      const totalExpenses = monthlyExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
      const totalBalance = accounts.reduce((sum, account) => sum + parseFloat(account.balance), 0);

      res.json({
        monthlyIncome: totalIncome.toFixed(2),
        monthlyExpenses: totalExpenses.toFixed(2),
        netIncome: (totalIncome - totalExpenses).toFixed(2),
        totalBalance: totalBalance.toFixed(2),
        currentMonth: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard summary" });
    }
  });

  app.get("/api/dashboard/recent-transactions", async (req, res) => {
    try {
      const [income, expenses, transfers, accounts] = await Promise.all([
        storage.getIncomeTransactions(),
        storage.getExpenseTransactions(),
        storage.getTransferTransactions(),
        storage.getAccounts()
      ]);

      const accountMap = new Map(accounts.map(acc => [acc.id, acc]));

      const allTransactions = [
        ...income.slice(0, 5).map(t => ({
          ...t,
          type: 'income',
          account: accountMap.get(t.accountId)?.name
        })),
        ...expenses.slice(0, 5).map(t => ({
          ...t,
          type: 'expense',
          account: accountMap.get(t.accountId)?.name
        })),
        ...transfers.slice(0, 5).map(t => ({
          ...t,
          type: 'transfer',
          fromAccount: accountMap.get(t.fromAccountId)?.name,
          toAccount: accountMap.get(t.toAccountId)?.name
        }))
      ].sort((a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime()).slice(0, 10);

      res.json(allTransactions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recent transactions" });
    }
  });

  // Receivables routes
  app.get("/api/receivables", async (req, res) => {
    try {
      const receivables = await storage.getReceivables();
      res.json(receivables);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch receivables" });
    }
  });

  app.post("/api/receivables", async (req, res) => {
    try {
      const validatedData = insertReceivableSchema.parse(req.body);
      const receivable = await storage.createReceivable(validatedData);
      res.status(201).json(receivable);
    } catch (error) {
      res.status(400).json({ message: "Invalid receivable data", error });
    }
  });

  app.patch("/api/receivables/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!["pending", "paid", "overdue"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const receivable = await storage.updateReceivableStatus(id, status);
      if (!receivable) {
        return res.status(404).json({ message: "Receivable not found" });
      }
      res.json(receivable);
    } catch (error) {
      res.status(500).json({ message: "Failed to update receivable status" });
    }
  });

  // Payables routes
  app.get("/api/payables", async (req, res) => {
    try {
      const payables = await storage.getPayables();
      res.json(payables);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch payables" });
    }
  });

  app.post("/api/payables", async (req, res) => {
    try {
      const validatedData = insertPayableSchema.parse(req.body);
      const payable = await storage.createPayable(validatedData);
      res.status(201).json(payable);
    } catch (error) {
      res.status(400).json({ message: "Invalid payable data", error });
    }
  });

  app.patch("/api/payables/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!["pending", "paid", "overdue"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const payable = await storage.updatePayableStatus(id, status);
      if (!payable) {
        return res.status(404).json({ message: "Payable not found" });
      }
      res.json(payable);
    } catch (error) {
      res.status(500).json({ message: "Failed to update payable status" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
