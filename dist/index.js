var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  accounts: () => accounts,
  expenseTransactions: () => expenseTransactions,
  incomeTransactions: () => incomeTransactions,
  insertAccountSchema: () => insertAccountSchema,
  insertExpenseSchema: () => insertExpenseSchema,
  insertIncomeSchema: () => insertIncomeSchema,
  insertPayableSchema: () => insertPayableSchema,
  insertReceivableSchema: () => insertReceivableSchema,
  insertTransferSchema: () => insertTransferSchema,
  payables: () => payables,
  receivables: () => receivables,
  transferTransactions: () => transferTransactions
});
import { pgTable, text, serial, decimal, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  // checking, savings, credit
  accountNumber: text("account_number").notNull(),
  balance: decimal("balance", { precision: 10, scale: 2 }).notNull().default("0")
});
var incomeTransactions = pgTable("income_transactions", {
  id: serial("id").primaryKey(),
  date: text("date").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  source: text("source").notNull(),
  // salary, freelance, business, investment, rental, other
  accountId: integer("account_id").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow()
});
var expenseTransactions = pgTable("expense_transactions", {
  id: serial("id").primaryKey(),
  date: text("date").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  category: text("category").notNull(),
  // food, utilities, transportation, entertainment, shopping, healthcare, education, housing, insurance, other
  accountId: integer("account_id").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow()
});
var transferTransactions = pgTable("transfer_transactions", {
  id: serial("id").primaryKey(),
  date: text("date").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  fromAccountId: integer("from_account_id").notNull(),
  toAccountId: integer("to_account_id").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow()
});
var receivables = pgTable("receivables", {
  id: serial("id").primaryKey(),
  date: text("date").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  customerName: text("customer_name").notNull(),
  description: text("description"),
  dueDate: text("due_date").notNull(),
  status: text("status").notNull().default("pending"),
  // pending, paid, overdue
  createdAt: timestamp("created_at").defaultNow()
});
var payables = pgTable("payables", {
  id: serial("id").primaryKey(),
  date: text("date").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  vendorName: text("vendor_name").notNull(),
  description: text("description"),
  dueDate: text("due_date").notNull(),
  status: text("status").notNull().default("pending"),
  // pending, paid, overdue
  createdAt: timestamp("created_at").defaultNow()
});
var insertAccountSchema = createInsertSchema(accounts).omit({
  id: true,
  balance: true
}).refine((data) => {
  const cleanAccountNumber = data.accountNumber.replace(/[\s-]/g, "");
  return cleanAccountNumber.length >= 4;
}, {
  message: "Account number must be at least 4 digits",
  path: ["accountNumber"]
});
var insertIncomeSchema = createInsertSchema(incomeTransactions).omit({
  id: true,
  createdAt: true
});
var insertExpenseSchema = createInsertSchema(expenseTransactions).omit({
  id: true,
  createdAt: true
});
var insertTransferSchema = createInsertSchema(transferTransactions).omit({
  id: true,
  createdAt: true
});
var insertReceivableSchema = createInsertSchema(receivables).omit({
  id: true,
  createdAt: true
});
var insertPayableSchema = createInsertSchema(payables).omit({
  id: true,
  createdAt: true
});

// server/db.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
neonConfig.webSocketConstructor = ws;
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle({ client: pool, schema: schema_exports });

// server/storage.ts
import { eq, desc, like } from "drizzle-orm";
function checkDbConnection() {
  if (!db) {
    throw new Error("Database not connected. Please set DATABASE_URL environment variable.");
  }
}
var DatabaseStorage = class {
  constructor() {
    this.initializeDefaultAccounts();
  }
  async initializeDefaultAccounts() {
    try {
      const existingAccounts = await db.select().from(accounts).limit(1);
      if (existingAccounts.length === 0) {
        const defaultAccounts = [
          { name: "Chase Checking", type: "checking", accountNumber: "****1234", balance: "12450.23" },
          { name: "Chase Savings", type: "savings", accountNumber: "****5678", balance: "25800.50" },
          { name: "Wells Fargo", type: "checking", accountNumber: "****9012", balance: "8320.75" },
          { name: "Capital One", type: "credit", accountNumber: "****3456", balance: "3680.00" },
          { name: "Bank of America", type: "savings", accountNumber: "****7890", balance: "15230.45" }
        ];
        for (const account of defaultAccounts) {
          await db.insert(accounts).values(account);
        }
      }
    } catch (error) {
      console.error("Error initializing default accounts:", error);
    }
  }
  // Accounts
  async getAccounts() {
    checkDbConnection();
    return await db.select().from(accounts);
  }
  async getAccount(id) {
    const [account] = await db.select().from(accounts).where(eq(accounts.id, id));
    return account || void 0;
  }
  async createAccount(insertAccount) {
    checkDbConnection();
    const [account] = await db.insert(accounts).values(insertAccount).returning();
    return account;
  }
  async updateAccountBalance(id, balance) {
    const [account] = await db.update(accounts).set({ balance }).where(eq(accounts.id, id)).returning();
    return account || void 0;
  }
  // Income
  async getIncomeTransactions() {
    return await db.select().from(incomeTransactions).orderBy(desc(incomeTransactions.createdAt));
  }
  async getIncomeByMonth(month) {
    return await db.select().from(incomeTransactions).where(like(incomeTransactions.date, `${month}%`));
  }
  async createIncome(insertIncome) {
    const [income] = await db.insert(incomeTransactions).values(insertIncome).returning();
    const account = await this.getAccount(insertIncome.accountId);
    if (account) {
      const newBalance = (parseFloat(account.balance) + parseFloat(insertIncome.amount)).toFixed(2);
      await this.updateAccountBalance(insertIncome.accountId, newBalance);
    }
    return income;
  }
  // Expenses
  async getExpenseTransactions() {
    return await db.select().from(expenseTransactions).orderBy(desc(expenseTransactions.createdAt));
  }
  async getExpensesByMonth(month) {
    return await db.select().from(expenseTransactions).where(like(expenseTransactions.date, `${month}%`));
  }
  async createExpense(insertExpense) {
    const [expense] = await db.insert(expenseTransactions).values(insertExpense).returning();
    const account = await this.getAccount(insertExpense.accountId);
    if (account) {
      const newBalance = (parseFloat(account.balance) - parseFloat(insertExpense.amount)).toFixed(2);
      await this.updateAccountBalance(insertExpense.accountId, newBalance);
    }
    return expense;
  }
  // Transfers
  async getTransferTransactions() {
    return await db.select().from(transferTransactions).orderBy(desc(transferTransactions.createdAt));
  }
  async createTransfer(insertTransfer) {
    const [transfer] = await db.insert(transferTransactions).values(insertTransfer).returning();
    const fromAccount = await this.getAccount(insertTransfer.fromAccountId);
    const toAccount = await this.getAccount(insertTransfer.toAccountId);
    if (fromAccount) {
      const newBalance = (parseFloat(fromAccount.balance) - parseFloat(insertTransfer.amount)).toFixed(2);
      await this.updateAccountBalance(insertTransfer.fromAccountId, newBalance);
    }
    if (toAccount) {
      const newBalance = (parseFloat(toAccount.balance) + parseFloat(insertTransfer.amount)).toFixed(2);
      await this.updateAccountBalance(insertTransfer.toAccountId, newBalance);
    }
    return transfer;
  }
  // Receivables
  async getReceivables() {
    return await db.select().from(receivables).orderBy(desc(receivables.createdAt));
  }
  async createReceivable(insertReceivable) {
    const [receivable] = await db.insert(receivables).values(insertReceivable).returning();
    return receivable;
  }
  async updateReceivableStatus(id, status) {
    const [receivable] = await db.update(receivables).set({ status }).where(eq(receivables.id, id)).returning();
    return receivable || void 0;
  }
  // Payables
  async getPayables() {
    return await db.select().from(payables).orderBy(desc(payables.createdAt));
  }
  async createPayable(insertPayable) {
    const [payable] = await db.insert(payables).values(insertPayable).returning();
    return payable;
  }
  async updatePayableStatus(id, status) {
    const [payable] = await db.update(payables).set({ status }).where(eq(payables.id, id)).returning();
    return payable || void 0;
  }
};
var storage = new DatabaseStorage();

// server/routes.ts
async function registerRoutes(app2) {
  app2.get("/api/accounts", async (req, res) => {
    try {
      const accounts2 = await storage.getAccounts();
      res.json(accounts2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch accounts" });
    }
  });
  app2.get("/api/accounts/:id", async (req, res) => {
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
  app2.post("/api/accounts", async (req, res) => {
    try {
      const validatedData = insertAccountSchema.parse(req.body);
      const account = await storage.createAccount(validatedData);
      res.status(201).json(account);
    } catch (error) {
      res.status(400).json({ message: "Invalid account data", error });
    }
  });
  app2.get("/api/income", async (req, res) => {
    try {
      const income = await storage.getIncomeTransactions();
      res.json(income);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch income transactions" });
    }
  });
  app2.get("/api/income/month/:month", async (req, res) => {
    try {
      const month = req.params.month;
      const income = await storage.getIncomeByMonth(month);
      res.json(income);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch monthly income" });
    }
  });
  app2.post("/api/income", async (req, res) => {
    try {
      const validatedData = insertIncomeSchema.parse(req.body);
      const income = await storage.createIncome(validatedData);
      res.status(201).json(income);
    } catch (error) {
      res.status(400).json({ message: "Invalid income data", error });
    }
  });
  app2.get("/api/expenses", async (req, res) => {
    try {
      const expenses = await storage.getExpenseTransactions();
      res.json(expenses);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch expense transactions" });
    }
  });
  app2.get("/api/expenses/month/:month", async (req, res) => {
    try {
      const month = req.params.month;
      const expenses = await storage.getExpensesByMonth(month);
      res.json(expenses);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch monthly expenses" });
    }
  });
  app2.post("/api/expenses", async (req, res) => {
    try {
      const validatedData = insertExpenseSchema.parse(req.body);
      const expense = await storage.createExpense(validatedData);
      res.status(201).json(expense);
    } catch (error) {
      res.status(400).json({ message: "Invalid expense data", error });
    }
  });
  app2.get("/api/transfers", async (req, res) => {
    try {
      const transfers = await storage.getTransferTransactions();
      res.json(transfers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch transfer transactions" });
    }
  });
  app2.post("/api/transfers", async (req, res) => {
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
  app2.get("/api/dashboard/summary", async (req, res) => {
    try {
      const currentMonth = (/* @__PURE__ */ new Date()).toISOString().slice(0, 7);
      const [accounts2, monthlyIncome, monthlyExpenses] = await Promise.all([
        storage.getAccounts(),
        storage.getIncomeByMonth(currentMonth),
        storage.getExpensesByMonth(currentMonth)
      ]);
      const totalIncome = monthlyIncome.reduce((sum, income) => sum + parseFloat(income.amount), 0);
      const totalExpenses = monthlyExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
      const totalBalance = accounts2.reduce((sum, account) => sum + parseFloat(account.balance), 0);
      res.json({
        monthlyIncome: totalIncome.toFixed(2),
        monthlyExpenses: totalExpenses.toFixed(2),
        netIncome: (totalIncome - totalExpenses).toFixed(2),
        totalBalance: totalBalance.toFixed(2),
        currentMonth: (/* @__PURE__ */ new Date()).toLocaleDateString("en-US", { month: "long", year: "numeric" })
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard summary" });
    }
  });
  app2.get("/api/dashboard/recent-transactions", async (req, res) => {
    try {
      const [income, expenses, transfers, accounts2] = await Promise.all([
        storage.getIncomeTransactions(),
        storage.getExpenseTransactions(),
        storage.getTransferTransactions(),
        storage.getAccounts()
      ]);
      const accountMap = new Map(accounts2.map((acc) => [acc.id, acc]));
      const allTransactions = [
        ...income.slice(0, 5).map((t) => ({
          ...t,
          type: "income",
          account: accountMap.get(t.accountId)?.name
        })),
        ...expenses.slice(0, 5).map((t) => ({
          ...t,
          type: "expense",
          account: accountMap.get(t.accountId)?.name
        })),
        ...transfers.slice(0, 5).map((t) => ({
          ...t,
          type: "transfer",
          fromAccount: accountMap.get(t.fromAccountId)?.name,
          toAccount: accountMap.get(t.toAccountId)?.name
        }))
      ].sort((a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime()).slice(0, 10);
      res.json(allTransactions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recent transactions" });
    }
  });
  app2.get("/api/receivables", async (req, res) => {
    try {
      const receivables2 = await storage.getReceivables();
      res.json(receivables2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch receivables" });
    }
  });
  app2.post("/api/receivables", async (req, res) => {
    try {
      const validatedData = insertReceivableSchema.parse(req.body);
      const receivable = await storage.createReceivable(validatedData);
      res.status(201).json(receivable);
    } catch (error) {
      res.status(400).json({ message: "Invalid receivable data", error });
    }
  });
  app2.patch("/api/receivables/:id/status", async (req, res) => {
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
  app2.get("/api/payables", async (req, res) => {
    try {
      const payables2 = await storage.getPayables();
      res.json(payables2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch payables" });
    }
  });
  app2.post("/api/payables", async (req, res) => {
    try {
      const validatedData = insertPayableSchema.parse(req.body);
      const payable = await storage.createPayable(validatedData);
      res.status(201).json(payable);
    } catch (error) {
      res.status(400).json({ message: "Invalid payable data", error });
    }
  });
  app2.patch("/api/payables/:id/status", async (req, res) => {
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
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
import "dotenv/config";
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = 5e3;
  app.listen(port, "127.0.0.1", () => {
    console.log("Server started on http://localhost:5000");
  });
})();
