import { useState, createContext, useContext } from "react";
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Plus, Trash } from "lucide-react";

const FinanceContext = createContext();

const mockData = [
  { id: 1, date: "2026-03-01", amount: 5000, category: "Salary", type: "income" },
  { id: 2, date: "2026-03-02", amount: 1200, category: "Food", type: "expense" },
  { id: 3, date: "2026-03-05", amount: 3000, category: "Freelance", type: "income" },
  { id: 4, date: "2026-03-06", amount: 800, category: "Transport", type: "expense" },
];

const Provider = ({ children }) => {
  const [transactions, setTransactions] = useState(mockData);
  const [role, setRole] = useState("viewer");

  const addTransaction = (t) =>
    setTransactions([...transactions, { ...t, id: Date.now() }]);

  const deleteTransaction = (id) =>
    setTransactions(transactions.filter((t) => t.id !== id));

  return (
    <FinanceContext.Provider
      value={{ transactions, addTransaction, deleteTransaction, role, setRole }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

const useFinance = () => useContext(FinanceContext);

//  Summary Cards
const Summary = () => {
  const { transactions } = useFinance();

  const income = transactions
    .filter((t) => t.type === "income")
    .reduce((a, b) => a + b.amount, 0);

  const expense = transactions
    .filter((t) => t.type === "expense")
    .reduce((a, b) => a + b.amount, 0);

  const balance = income - expense;

  return (
    <div className="grid md:grid-cols-3 gap-4">
      <Card title="Balance" value={balance} />
      <Card title="Income" value={income} />
      <Card title="Expenses" value={expense} />
    </div>
  );
};

const Card = ({ title, value }) => (
  <div className="p-4 shadow rounded-2xl bg-white">
    <h3 className="text-gray-500">{title}</h3>
    <p className="text-xl font-bold">₹{value}</p>
  </div>
);

//  Charts
const Charts = () => {
  const { transactions } = useFinance();

  const lineData = transactions.map((t) => ({
    date: t.date,
    amount: t.amount,
  }));

  const categoryMap = {};
  transactions.forEach((t) => {
    if (t.type === "expense") {
      categoryMap[t.category] =
        (categoryMap[t.category] || 0) + t.amount;
    }
  });

  const pieData = Object.keys(categoryMap).map((key) => ({
    name: key,
    value: categoryMap[key],
  }));

  return (
    <div className="grid md:grid-cols-2 gap-4 mt-4">
      <div className="bg-white p-4 rounded-2xl shadow">
        <h2>Balance Trend</h2>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={lineData}>
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="amount" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow">
        <h2>Spending</h2>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie data={pieData} dataKey="value" nameKey="name">
              {pieData.map((_, i) => (
                <Cell key={i} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

//  Transactions
const Transactions = () => {
  const { transactions, deleteTransaction, role } = useFinance();

  return (
    <div className="mt-6 bg-white p-4 rounded-2xl shadow">
      <h2 className="text-lg font-bold mb-2">Transactions</h2>
      <table className="w-full">
        <thead>
          <tr>
            <th>Date</th>
            <th>Category</th>
            <th>Amount</th>
            <th>Type</th>
            {role === "admin" && <th>Action</th>}
          </tr>
        </thead>
        <tbody>
          {transactions.map((t) => (
            <tr key={t.id}>
              <td>{t.date}</td>
              <td>{t.category}</td>
              <td>₹{t.amount}</td>
              <td>{t.type}</td>
              {role === "admin" && (
                <td>
                  <button onClick={() => deleteTransaction(t.id)}>
                    <Trash size={16} />
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

//  Add Transaction
const AddTransaction = () => {
  const { addTransaction, role } = useFinance();
  const [form, setForm] = useState({
    date: "",
    amount: "",
    category: "",
    type: "expense",
  });

  if (role !== "admin") return null;

  return (
    <div className="mt-4 flex gap-2">
      <input
        placeholder="Date"
        onChange={(e) => setForm({ ...form, date: e.target.value })}
      />
      <input
        placeholder="Amount"
        onChange={(e) =>
          setForm({ ...form, amount: +e.target.value })
        }
      />
      <input
        placeholder="Category"
        onChange={(e) =>
          setForm({ ...form, category: e.target.value })
        }
      />
      <select
        onChange={(e) => setForm({ ...form, type: e.target.value })}
      >
        <option value="expense">Expense</option>
        <option value="income">Income</option>
      </select>
      <button
        onClick={() => addTransaction(form)}
        className="bg-blue-500 text-white px-2"
      >
        <Plus />
      </button>
    </div>
  );
};

//  Insights
const Insights = () => {
  const { transactions } = useFinance();

  const categorySpend = {};
  transactions.forEach((t) => {
    if (t.type === "expense") {
      categorySpend[t.category] =
        (categorySpend[t.category] || 0) + t.amount;
    }
  });

  const highest =
    Object.keys(categorySpend).length > 0
      ? Object.keys(categorySpend).reduce((a, b) =>
          categorySpend[a] > categorySpend[b] ? a : b
        )
      : "N/A";

  return (
    <div className="mt-6 bg-white p-4 rounded-2xl shadow">
      <h2 className="font-bold">Insights</h2>
      <p>Highest spending category: {highest}</p>
      <p>Total Transactions: {transactions.length}</p>
    </div>
  );
};

//  Role Switch
const RoleSwitch = () => {
  const { role, setRole } = useFinance();

  return (
    <select
      value={role}
      onChange={(e) => setRole(e.target.value)}
      className="mb-4"
    >
      <option value="viewer">Viewer</option>
      <option value="admin">Admin</option>
    </select>
  );
};

//  Main App
export default function App() {
  return (
    <Provider>
      <div className="p-4 bg-gray-100 min-h-screen">
        <RoleSwitch />
        <Summary />
        <Charts />
        <AddTransaction />
        <Transactions />
        <Insights />
      </div>
    </Provider>
  );
}