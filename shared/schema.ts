import { pgTable, text, serial, decimal, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // checking, savings, credit
  accountNumber: text("account_number").notNull(),
  balance: decimal("balance", { precision: 10, scale: 2 }).notNull().default("0"),
});

export const incomeTransactions = pgTable("income_transactions", {
  id: serial("id").primaryKey(),
  date: text("date").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  source: text("source").notNull(), // salary, freelance, business, investment, rental, other
  accountId: integer("account_id").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const expenseTransactions = pgTable("expense_transactions", {
  id: serial("id").primaryKey(),
  date: text("date").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  category: text("category").notNull(), // food, utilities, transportation, entertainment, shopping, healthcare, education, housing, insurance, other
  accountId: integer("account_id").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const transferTransactions = pgTable("transfer_transactions", {
  id: serial("id").primaryKey(),
  date: text("date").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  fromAccountId: integer("from_account_id").notNull(),
  toAccountId: integer("to_account_id").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const receivables = pgTable("receivables", {
  id: serial("id").primaryKey(),
  date: text("date").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  customerName: text("customer_name").notNull(),
  description: text("description"),
  dueDate: text("due_date").notNull(),
  status: text("status").notNull().default("pending"), // pending, paid, overdue
  createdAt: timestamp("created_at").defaultNow(),
});

export const payables = pgTable("payables", {
  id: serial("id").primaryKey(),
  date: text("date").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  vendorName: text("vendor_name").notNull(),
  description: text("description"),
  dueDate: text("due_date").notNull(),
  status: text("status").notNull().default("pending"), // pending, paid, overdue
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAccountSchema = createInsertSchema(accounts).omit({
  id: true,
  balance: true,
});

export const insertIncomeSchema = createInsertSchema(incomeTransactions).omit({
  id: true,
  createdAt: true,
});

export const insertExpenseSchema = createInsertSchema(expenseTransactions).omit({
  id: true,
  createdAt: true,
});

export const insertTransferSchema = createInsertSchema(transferTransactions).omit({
  id: true,
  createdAt: true,
});

export const insertReceivableSchema = createInsertSchema(receivables).omit({
  id: true,
  createdAt: true,
});

export const insertPayableSchema = createInsertSchema(payables).omit({
  id: true,
  createdAt: true,
});

export type InsertAccount = z.infer<typeof insertAccountSchema>;
export type Account = typeof accounts.$inferSelect;
export type InsertIncome = z.infer<typeof insertIncomeSchema>;
export type Income = typeof incomeTransactions.$inferSelect;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type Expense = typeof expenseTransactions.$inferSelect;
export type InsertTransfer = z.infer<typeof insertTransferSchema>;
export type Transfer = typeof transferTransactions.$inferSelect;
export type InsertReceivable = z.infer<typeof insertReceivableSchema>;
export type Receivable = typeof receivables.$inferSelect;
export type InsertPayable = z.infer<typeof insertPayableSchema>;
export type Payable = typeof payables.$inferSelect;
