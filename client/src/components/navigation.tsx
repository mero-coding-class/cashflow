import { Link, useLocation } from "wouter";
import { ChartLine } from "lucide-react";

const navItems = [
  { path: "/", label: "Dashboard", key: "dashboard" },
  { path: "/income", label: "Income", key: "income" },
  { path: "/expenses", label: "Expenses", key: "expenses" },
  { path: "/transfers", label: "Transfers", key: "transfers" },
  { path: "/receivables", label: "Receivables", key: "receivables" },
  { path: "/payables", label: "Payables", key: "payables" },
  { path: "/accounts", label: "Accounts", key: "accounts" },
];

export function Navigation() {
  const [location] = useLocation();

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <ChartLine className="text-white text-sm" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">FinanceTracker</h1>
          </div>
          <div className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => {
              const isActive = location === item.path;
              return (
                <Link key={item.key} href={item.path}>
                  <button
                    className={`px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? "text-primary border-b-2 border-primary"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {item.label}
                  </button>
                </Link>
              );
            })}
          </div>
          <div className="flex items-center">
            <button className="p-2 rounded-lg text-gray-400 hover:text-gray-600">
              <i className="fas fa-user-circle text-xl"></i>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
