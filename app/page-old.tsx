'use client'

import { useState, useMemo, useEffect } from 'react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"

interface Expense {
  name: string
  amount: number
  isSubcategory?: boolean
}

interface GroupedExpense {
  name: string
  amount: number
  subCategories?: { name: string; amount: number }[]
}

interface Transaction {
  date: string;
  icon: string;
  name: string;
  note: string;
  amount: number;
  currency: string;
  type: 'expense' | 'income';
  recurring?: string;
}

const ExpenseChart = () => {
  const [expenses, setExpenses] = useState<GroupedExpense[]>([])
  const [expandedCategories, setExpandedCategories] = useState<string[]>([])
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [transactionType, setTransactionType] = useState<'expense' | 'income' | 'all'>('expense');
  const [rawTransactions, setRawTransactions] = useState<Transaction[]>([]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const rows = text.split('\n').slice(1);

      const transactions: Transaction[] = rows
        .filter(row => row.trim())
        .map(row => {
          const [date, icon, name, note, amount, currency, type, recurring] = row.split(',').map(cell => cell.trim());
          return {
            date,
            icon,
            name,
            note,
            amount: parseFloat(amount) || 0,
            currency,
            type: type as 'expense' | 'income',
            recurring
          };
        });

      setRawTransactions(transactions);
      processTransactions(transactions);
    };

    reader.readAsText(file);
  };

  const processTransactions = (transactions: Transaction[]) => {
    const filteredTransactions = transactions.filter(transaction => {
      // Filter by date range if set
      if (dateRange.start && dateRange.end) {
        const transDate = new Date(transaction.date);
        const startDate = new Date(dateRange.start);
        const endDate = new Date(dateRange.end);
        if (transDate < startDate || transDate > endDate) return false;
      }
      // Filter by transaction type
      if (transactionType !== 'all' && transaction.type !== transactionType) return false;
      return true;
    });

    const groupedData = filteredTransactions.reduce((acc, transaction) => {
      const existing = acc.find(e => e.name === transaction.name);
      if (existing) {
        existing.amount += transaction.amount;
        existing.subCategories = existing.subCategories || [];
        if (transaction.note) {
          const existingSub = existing.subCategories.find(s => s.name === transaction.note);
          if (existingSub) {
            existingSub.amount += transaction.amount;
          } else {
            existing.subCategories.push({ name: transaction.note, amount: transaction.amount });
          }
        } else if (!transaction.note && existing.subCategories?.length > 0) {
          const existingSub = existing.subCategories.find(s => s.name === "Other");
          if (existingSub) {
            existingSub.amount += transaction.amount;
          } else {
            existing.subCategories.push({ name: "Other", amount: transaction.amount });
          }
        }
      } else {
        const newCategory: GroupedExpense = {
          name: transaction.name,
          amount: transaction.amount
        };
        if (transaction.note) {
          newCategory.subCategories = [{ name: transaction.note, amount: transaction.amount }];
        }
        acc.push(newCategory);
      }
      return acc;
    }, [] as GroupedExpense[]);

    const sortedData = groupedData
      .map(category => ({
        ...category,
        subCategories: category.subCategories?.sort((a, b) => b.amount - a.amount)
      }))
      .sort((a, b) => b.amount - a.amount);
    setExpenses(sortedData);
  };

  useEffect(() => {
    if (rawTransactions.length > 0) {
      processTransactions(rawTransactions);
    }
  }, [dateRange, transactionType]);

  const resetFilters = () => {
    setDateRange({ start: '', end: '' });
    setTransactionType('expense');
  };

  const toggleCategory = (data: Expense) => {
    if (!data.isSubcategory && expenses.find(e => e.name === data.name)?.subCategories?.length) {
      setExpandedCategories(prev =>
        prev.includes(data.name) ? prev.filter(name => name !== data.name) : [...prev, data.name]
      )
    }
  }

  const chartData = useMemo(() => {
    const result: Expense[] = []

    expenses.forEach(expense => {
      // Add main category
      result.push({ name: expense.name, amount: expense.amount })

      // Add subcategories if category is expanded
      if (expandedCategories.includes(expense.name)) {
        expense.subCategories?.forEach(sub => {
          result.push({
            name: `└─ ${sub.name}`,
            amount: sub.amount,
            isSubcategory: true
          })
        })
      }
    })

    return result
  }, [expenses, expandedCategories])

  console.log(expandedCategories);


  return (
    <div className="p-2 sm:p-4 w-full bg-black">
      <div className="flex flex-col gap-4 mb-4">
        <div className="flex items-center gap-4 flex-wrap">
          <h2 className="text-xl text-white font-bold capitalize">{transactionType} Categories</h2>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="text-sm text-slate-300
              file:mr-4 file:py-2 file:px-4 file:border-0 file:rounded-none
              file:text-sm file:font-semibold file:cursor-pointer
              file:bg-violet-100 file:text-violet-700
              hover:file:bg-violet-200 hover:file:text-violet-600"
          />
        </div>

        <div className="flex gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-300">From:</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="p-2 bg-[#444] text-white focus:outline-none cursor-pointer hover:bg-[#666] rounded-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-300">To:</label>
            <input
              type="date"
              min={dateRange.start}
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="p-2 bg-[#444] text-white focus:outline-none cursor-pointer hover:bg-[#666] rounded-none"
            />
          </div>

          <select
            value={transactionType}
            onChange={(e) => setTransactionType(e.target.value as 'expense' | 'income' | 'all')}
            className="p-2 bg-[#444] text-white focus:outline-none cursor-pointer hover:bg-[#666] rounded-none"
          >
            <option value="all">All Types</option>
            <option value="expense">Expenses</option>
            <option value="income">Income</option>
          </select>

          <button
            onClick={resetFilters}
            className="px-4 py-2 text-sm text-white bg-[#444] hover:bg-[#666] rounded-none"
          >
            Reset Filters
          </button>
        </div>
      </div>

      <div className="h-screen">
        {expenses.length > 0 ?
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              barSize={100}

            >
              <CartesianGrid horizontal strokeDasharray="3 3" opacity={0.3} />
              <XAxis type="number" tickFormatter={(value) => `Kes ${value.toLocaleString()}`} />
              <YAxis
                type="category"
                dataKey="name"
                hide
              />
              <Tooltip
                contentStyle={{ color: 'black' }}
                formatter={(value, name, props) => {
                  const formattedValue = `KES ${(value as number).toLocaleString()}`
                  return [`${formattedValue}`]
                }}
              />
              <Bar
                dataKey="amount"
                className='cursor-pointer'
                onClick={toggleCategory}
                shape={(props:any) => {
                  const { x, y, width, height, payload } = props
                  const hasSubcategories = (expenses.find(e => e.name === payload.name)?.subCategories?.length ?? 0) > 0;
                  return <rect x={x} y={y} width={width} height={height} fill={payload.isSubcategory ? "purple" : hasSubcategories ? "#777" : "#444"} />
                }}
                label={(props: any) => {
                  const { x, y, width, height, value, name } = props;
                  const isSubcategory = name.startsWith('└─');
                  const displayName = isSubcategory ? name.substring(3) : name;
                  const hasSubcategories = (expenses.find(e => e.name === displayName)?.subCategories?.length ?? 0) > 0;
                  return (
                    <g>
                      <text
                        x={x + 5}
                        y={y + height / 2}
                        dy={4}
                        fill="#fff"
                        fontSize={12}
                        textAnchor="start"
                      >
                        {hasSubcategories ? (expandedCategories.includes(displayName) ? '▼ ' : '▲ ') : ''}
                        {displayName}
                      </text>
                      {width > 200 ? <text
                        x={x + width - 10}
                        y={y + height / 2}
                        dy={4}
                        fill="#fff"
                        fontSize={13}
                        textAnchor="end"
                      >
                        {`KES ${value.toLocaleString()}`}
                      </text> : null}
                    </g>
                  );
                }
                }
              />
            </BarChart>
          </ResponsiveContainer>
          :
          <div className="flex flex-col items-center sm:justify-center mt-40 sm:mt-0 h-full">
            <h2 className="text-xl text-center text-white font-bold">Upload a CSV file to get started</h2>
          </div>
        }
      </div>
    </div>
  )
}

export default ExpenseChart