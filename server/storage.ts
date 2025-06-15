import { 
  accounts, 
  incomeTransactions, 
  expenseTransactions, 
  transferTransactions,
  receivables,
  payables,
  type Account, 
  type Income, 
  type Expense, 
  type Transfer,
  type Receivable,
  type Payable,
  type InsertAccount,
  type InsertIncome,
  type InsertExpense,
  type InsertTransfer,
  type InsertReceivable,
  type InsertPayable
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, like } from "drizzle-orm";

export interface IStorage {
  // Accounts
  getAccounts(): Promise<Account[]>;
  getAccount(id: number): Promise<Account | undefined>;
  createAccount(account: InsertAccount): Promise<Account>;
  updateAccountBalance(id: number, balance: string): Promise<Account | undefined>;

  // Income
  getIncomeTransactions(): Promise<Income[]>;
  getIncomeByMonth(month: string): Promise<Income[]>;
  createIncome(income: InsertIncome): Promise<Income>;

  // Expenses
  getExpenseTransactions(): Promise<Expense[]>;
  getExpensesByMonth(month: string): Promise<Expense[]>;
  createExpense(expense: InsertExpense): Promise<Expense>;

  // Transfers
  getTransferTransactions(): Promise<Transfer[]>;
  createTransfer(transfer: InsertTransfer): Promise<Transfer>;

  // Receivables
  getReceivables(): Promise<Receivable[]>;
  createReceivable(receivable: InsertReceivable): Promise<Receivable>;
  updateReceivableStatus(id: number, status: string): Promise<Receivable | undefined>;

  // Payables
  getPayables(): Promise<Payable[]>;
  createPayable(payable: InsertPayable): Promise<Payable>;
  updatePayableStatus(id: number, status: string): Promise<Payable | undefined>;
}

export class DatabaseStorage implements IStorage {
  constructor() {
    // Initialize with default accounts if none exist
    this.initializeDefaultAccounts();
  }

  private async initializeDefaultAccounts() {
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
  async getAccounts(): Promise<Account[]> {
    return await db.select().from(accounts);
  }

  async getAccount(id: number): Promise<Account | undefined> {
    const [account] = await db.select().from(accounts).where(eq(accounts.id, id));
    return account || undefined;
  }

  async createAccount(insertAccount: InsertAccount): Promise<Account> {
    const [account] = await db
      .insert(accounts)
      .values(insertAccount)
      .returning();
    return account;
  }

  async updateAccountBalance(id: number, balance: string): Promise<Account | undefined> {
    const [account] = await db
      .update(accounts)
      .set({ balance })
      .where(eq(accounts.id, id))
      .returning();
    return account || undefined;
  }

  // Income
  async getIncomeTransactions(): Promise<Income[]> {
    return await db.select().from(incomeTransactions).orderBy(desc(incomeTransactions.createdAt));
  }

  async getIncomeByMonth(month: string): Promise<Income[]> {
    return await db.select().from(incomeTransactions).where(like(incomeTransactions.date, `${month}%`));
  }

  async createIncome(insertIncome: InsertIncome): Promise<Income> {
    const [income] = await db
      .insert(incomeTransactions)
      .values(insertIncome)
      .returning();

    // Update account balance
    const account = await this.getAccount(insertIncome.accountId);
    if (account) {
      const newBalance = (parseFloat(account.balance) + parseFloat(insertIncome.amount)).toFixed(2);
      await this.updateAccountBalance(insertIncome.accountId, newBalance);
    }

    return income;
  }

  // Expenses
  async getExpenseTransactions(): Promise<Expense[]> {
    return await db.select().from(expenseTransactions).orderBy(desc(expenseTransactions.createdAt));
  }

  async getExpensesByMonth(month: string): Promise<Expense[]> {
    return await db.select().from(expenseTransactions).where(like(expenseTransactions.date, `${month}%`));
  }

  async createExpense(insertExpense: InsertExpense): Promise<Expense> {
    const [expense] = await db
      .insert(expenseTransactions)
      .values(insertExpense)
      .returning();

    // Update account balance
    const account = await this.getAccount(insertExpense.accountId);
    if (account) {
      const newBalance = (parseFloat(account.balance) - parseFloat(insertExpense.amount)).toFixed(2);
      await this.updateAccountBalance(insertExpense.accountId, newBalance);
    }

    return expense;
  }

  // Transfers
  async getTransferTransactions(): Promise<Transfer[]> {
    return await db.select().from(transferTransactions).orderBy(desc(transferTransactions.createdAt));
  }

  async createTransfer(insertTransfer: InsertTransfer): Promise<Transfer> {
    const [transfer] = await db
      .insert(transferTransactions)
      .values(insertTransfer)
      .returning();

    // Update both account balances
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
  async getReceivables(): Promise<Receivable[]> {
    return await db.select().from(receivables).orderBy(desc(receivables.createdAt));
  }

  async createReceivable(insertReceivable: InsertReceivable): Promise<Receivable> {
    const [receivable] = await db
      .insert(receivables)
      .values(insertReceivable)
      .returning();
    return receivable;
  }

  async updateReceivableStatus(id: number, status: string): Promise<Receivable | undefined> {
    const [receivable] = await db
      .update(receivables)
      .set({ status })
      .where(eq(receivables.id, id))
      .returning();
    return receivable || undefined;
  }

  // Payables
  async getPayables(): Promise<Payable[]> {
    return await db.select().from(payables).orderBy(desc(payables.createdAt));
  }

  async createPayable(insertPayable: InsertPayable): Promise<Payable> {
    const [payable] = await db
      .insert(payables)
      .values(insertPayable)
      .returning();
    return payable;
  }

  async updatePayableStatus(id: number, status: string): Promise<Payable | undefined> {
    const [payable] = await db
      .update(payables)
      .set({ status })
      .where(eq(payables.id, id))
      .returning();
    return payable || undefined;
  }
}

export const storage = new DatabaseStorage();
