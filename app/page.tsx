'use client'

import Image from 'next/image'
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
  const [isDragging, setIsDragging] = useState(false);
  const [fileAdded, setFileAdded] = useState<File | null>(null);


  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileAdded(file);
  }

  useEffect(() => {
    if (!fileAdded) return;
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
    reader.onerror = (err) => {
      alert('Error reading file')
    };
    reader.readAsText(fileAdded);
  }, [fileAdded]);

  const processTransactions = useMemo(() => (transactions: Transaction[]) => {
    const filteredTransactions = transactions.filter(transaction => {
      // Filter by date range if set
      if (dateRange.start && dateRange.end) {
        const transDate = new Date(transaction.date);
        const startDate = new Date(dateRange.start);
        const endDate = new Date(dateRange.end);
        if (isNaN(transDate.getTime()) || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return false;
        if (transDate < startDate || transDate > endDate) return false;
      }
      // Filter by transaction type
      if (transactionType !== 'all' && transaction.type !== transactionType) return false;
      return true;
    });

    const groupedData = filteredTransactions.reduce((acc, transaction) => {
      const existing = acc.find(e => e.name === transaction.name);
      const transactionNote = transaction.note?.trim();
      if (existing) {
        existing.amount += transaction.amount;
        existing.subCategories = existing.subCategories || [];
        const existingSubLen = existing.subCategories.length;
        let checkNote = transactionNote;

        if (transactionNote && !existingSubLen) {
          existing.subCategories.push(
            { name: "Other", amount: existing.amount - transaction.amount },
            { name: checkNote, amount: transaction.amount });
          return acc;
        } else if (!transactionNote && existingSubLen) checkNote = "Other";

        const existingSub = existing.subCategories.find(s => s.name === checkNote);
        if (existingSub) existingSub.amount += transaction.amount;
        else checkNote && existing.subCategories.push({ name: checkNote, amount: transaction.amount });
      } else {
        const newCategory: GroupedExpense = {
          name: transaction.name,
          amount: transaction.amount
        };
        if (transactionNote) newCategory.subCategories = [{ name: transactionNote, amount: transaction.amount }];
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
  }, [dateRange, transactionType]);

  useEffect(() => {
    if (rawTransactions.length > 0) processTransactions(rawTransactions);
  }, [dateRange, transactionType]);

  const resetFilters = () => {
    setDateRange({ start: '', end: '' });
    setTransactionType('expense');
  };

  const toggleCategory = (data: Expense) => {
    if (!data?.isSubcategory && expenses.find(e => e.name === data.name)?.subCategories?.length) {
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

  const getChartHeight = () => {
    const baseHeight = 100;
    const rowHeight = 70;
    const minHeight = 400;
    return Math.max(baseHeight + chartData.length * rowHeight, minHeight);
  };

  return (
    <div className="p-2 xs:p-4 w-full min-h-screen bg-gradient-to-br from-gray-900 via-black to-purple-900">
      <div className="flex flex-col gap-6 mb-6">
        <div className="">
          <div className='flex items-center gap-2 flex-wrap'>
            <Image src="/tencents-nobg.png" alt="" width={40} height={40} />
            <h2 className='text-2xl text-white font-bold capitalize tracking-tight'>Ten Cents</h2>
          </div>
          <span className="block text-sm font-normal text-purple-400 mt-1">Analyze your financial {transactionType === 'expense' ? 'expenses' : transactionType === 'income' ? 'income' : 'flow'}</span>
        </div>

        <div className="flex gap-4 flex-col flex-wrap xs:flex-row p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
          <div className='flex flex-col xs:flex-row gap-2 xs:items-center w-full xs:w-auto'>
            <label className="text-sm text-purple-300">Date</label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="p-2.5 bg-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 
                cursor-pointer hover:bg-white/20 rounded-lg transition-all text-sm w-full"
              />
              <span className='text-purple-300 self-start'>_</span>
              <input
                type="date"
                min={dateRange.start}
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="p-2.5 bg-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 
                cursor-pointer hover:bg-white/20 rounded-lg transition-all text-sm w-full"
              />
            </div>
          </div>

          <div className='flex gap-4'>
            <select
              value={transactionType}
              onChange={(e) => setTransactionType(e.target.value as 'expense' | 'income' | 'all')}
              className="p-2.5 bg-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 
              cursor-pointer hover:bg-white/20 rounded-lg transition-all text-sm w-fit"
            >
              <option value="all">All Types</option>
              <option value="expense">Expenses</option>
              <option value="income">Income</option>
            </select>

            <button
              onClick={resetFilters}
              className="px-6 py-2.5 text-sm text-white bg-white/10 hover:bg-white/20 
              focus:outline-none focus:ring-2 focus:ring-purple-500 rounded-lg transition-all
              flex items-center gap-2 w-fit"
            >
              <svg xmlns="http://www.w3.org/2000/svg" height="1em" fill='white' viewBox="0 0 576 512"><path d="M3.9 22.9C10.5 8.9 24.5 0 40 0L472 0c15.5 0 29.5 8.9 36.1 22.9s4.6 30.5-5.2 42.5L396.4 195.6C316.2 212.1 256 283 256 368c0 27.4 6.3 53.4 17.5 76.5c-1.6-.8-3.2-1.8-4.7-2.9l-64-48c-8.1-6-12.8-15.5-12.8-25.6l0-79.1L9 65.3C-.7 53.4-2.8 36.8 3.9 22.9zM432 224a144 144 0 1 1 0 288 144 144 0 1 1 0-288zm59.3 107.3c6.2-6.2 6.2-16.4 0-22.6s-16.4-6.2-22.6 0L432 345.4l-36.7-36.7c-6.2-6.2-16.4-6.2-22.6 0s-6.2 16.4 0 22.6L409.4 368l-36.7 36.7c-6.2 6.2-6.2 16.4 0 22.6s16.4 6.2 22.6 0L432 390.6l36.7-36.7z" /></svg>
              Reset
            </button>
          </div>

          {fileAdded && <button
            onClick={() => {
              setFileAdded(null);
              setRawTransactions([]);
              setExpenses([]);
            }}
            className="px-6 py-2.5 text-sm text-white bg-red-500/30 hover:bg-red-500/20 
              focus:outline-none focus:ring-2 focus:ring-purple-500 rounded-lg transition-all
              flex items-center gap-2 w-fit"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" height="1em" fill='white'>
              <path d="M135.2 17.7L128 32 32 32C14.3 32 0 46.3 0 64S14.3 96 32 96l384 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-96 0-7.2-14.3C307.4 6.8 296.3 0 284.2 0L163.8 0c-12.1 0-23.2 6.8-28.6 17.7zM416 128L32 128 53.2 467c1.6 25.3 22.6 45 47.9 45l245.8 0c25.3 0 46.3-19.7 47.9-45L416 128z" />
            </svg>
            Remove
          </button>}
        </div>
      </div>

      <div className="w-full">
        {expenses.length > 0 ? (
          <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
            <div style={{ height: getChartHeight() }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  layout="vertical"
                  barSize={40}
                >
                  <CartesianGrid horizontal strokeDasharray="3 3" opacity={0.1} />
                  <XAxis
                    type="number"
                    padding={{ left: 5 }}
                    opacity={0.5}
                    tickFormatter={(value) => `Kes ${value.toLocaleString()}`}
                    stroke="#9CA3AF"
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={150}
                    hide
                    stroke="#9CA3AF"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(0, 0, 0, 0.5)',
                      backdropFilter: 'blur(8px)',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      borderRadius: '8px',
                      color: 'white'
                    }}
                    cursor={{ fill: 'rgba(129, 140, 248, 0.1)' }}
                    itemStyle={{ color: 'white' }}
                    formatter={(value) => [`KES ${(value as number).toLocaleString()}`]}
                  />
                  <Bar
                    dataKey="amount"
                    className="cursor-pointer"
                    onClick={toggleCategory}
                    shape={(props: any) => {
                      const { x, y, width, height, payload } = props;
                      const hasSubcategories = (expenses.find(e => e.name === payload.name)?.subCategories?.length ?? 0) > 0;
                      const gradient = payload.isSubcategory
                        ? "#9333EA"  // Subcategory (purple)
                        : hasSubcategories
                          ? "#4F46E5"  // Category with subcategories (blue)
                          : "#818CF8";  // Regular category (lighter indigo)
                      return (
                        <rect
                          x={x}
                          y={y + 10}
                          width={width}
                          height={height}
                          fill={gradient}
                          rx={4}
                          ry={4}
                          opacity={0.9}
                        />
                      );
                    }}
                    label={(props) => {
                      const { x, y, width, height, value, name } = props;
                      const isSubcategory = name.startsWith('└─');
                      const displayName = isSubcategory ? name.substring(3) : name;
                      const hasSubcategories = (expenses.find(e => e.name === displayName)?.subCategories?.length ?? 0) > 0;

                      return (
                        <g onClick={() => hasSubcategories && toggleCategory({ name: displayName, amount: value as number, isSubcategory: isSubcategory })}>
                          {hasSubcategories && (
                            <svg
                              x={x}
                              y={y - 9}
                              width={13}
                              height={13}
                              viewBox="0 0 320 512"
                              fill="white"
                            >
                              {expandedCategories.includes(displayName) ? (
                                <path d="M137.4 374.6c12.5 12.5 32.8 12.5 45.3 0l128-128c9.2-9.2 11.9-22.9 6.9-34.9s-16.6-19.8-29.6-19.8L32 192c-12.9 0-24.6 7.8-29.6 19.8s-2.2 25.7 6.9 34.9l128 128z" />
                              ) : (
                                <path d="M246.6 278.6c12.5-12.5 12.5-32.8 0-45.3l-128-128c-9.2-9.2-22.9-11.9-34.9-6.9s-19.8 16.6-19.8 29.6l0 256c0 12.9 7.8 24.6 19.8 29.6s25.7 2.2 34.9-6.9l128-128z" />
                              )}
                            </svg>
                          )}
                          <text
                            x={x + (hasSubcategories ? 16 : 0)}
                            y={y + 2}
                            fill="white"
                            fontSize={12}
                            textAnchor="start"
                          >
                            {displayName}
                          </text>

                          {width > 100 && (
                            <text
                              x={x + width - 8}
                              y={y + height / 2 + 10}
                              dy={4}
                              fill="white"
                              fontSize={12}
                              textAnchor="end"
                            >
                              {`KES ${value.toLocaleString()}`}
                            </text>
                          )}
                        </g>
                      );
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) :
          fileAdded ? (
            <h2 className='text-xl text-center text-white font-bold capitalize tracking-tight'>No transactions found</h2>
          ) : (
            <div>
              <label
                className={`flex flex-col items-center justify-center h-full space-y-4 
                      bg-white/5 backdrop-blur-sm rounded-xl border-2 
                      ${isDragging ? 'border-purple-500 border-dashed' : 'border-white/10'}
                      p-4 cursor-pointer hover:bg-white/10 transition-all`
                }
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleFileUpload({ target: { files: [file] } } as any);
                }}
              >
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <svg xmlns="http://www.w3.org/2000/svg"
                  className={`h-16 w-16 ${isDragging ? 'text-purple-500 scale-110' : 'text-purple-400 animate-pulse'} transition-all`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <h2 className="text-xl text-center text-white font-medium">
                  {isDragging ? 'Drop your CSV file here' : 'Add a CSV file to get started'}
                </h2>
                <p className="text-purple-400 text-sm">
                  {isDragging ? 'Release to analyze' : 'Drag and drop or click to browse'}
                </p>
              </label>
              <a href="/expense-analyzer-template.csv" className='text-purple-400 hover:text-purple-300 transition-all underline text-center block mt-6'>
                Download sample csv here
              </a>
            </div>
          )}
      </div>
    </div>
  )
}

export default ExpenseChart