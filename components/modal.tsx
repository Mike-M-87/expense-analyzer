"use client";

import { useState, useEffect, useRef } from "react";
import { CloseIcon, GraphIcon, ImportCsvIcon, ImportFileIcon } from "./icons";
import { CsvReader } from "@/app/reader";


export function EditorModal({ currentExpenses, onClose, onViewSaved }: { currentExpenses: Transaction[], onClose: () => void, onViewSaved: (txn: Transaction[]) => void }) {
  const [loading, setLoading] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [savedTransactions, setSavedTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [activeTab, setActiveTab] = useState<'saved' | 'add'>('saved');
  const [searchTerm, setSearchTerm] = useState('');

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    CsvReader(file, (transactions) => {
      setSavedTransactions(transactions);
      localStorage.setItem('expenses', JSON.stringify(transactions));
      setActiveTab('saved');
    });
  }

  useEffect(() => {
    const storedTransactions = localStorage.getItem('expenses');
    if (!storedTransactions) {
      setActiveTab('add');
      return;
    };
    const parsedTransactions = JSON.parse(storedTransactions) as Transaction[];
    if (parsedTransactions.length === 0) setActiveTab('add');
    setSavedTransactions(parsedTransactions);
  }, []);

  useEffect(() => {
    setFilteredTransactions(savedTransactions)
    setSearchTerm('');
  }, [savedTransactions]);


  function closeModal() {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 240);
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const formvalues = Object.fromEntries(formData.entries()) as unknown as Transaction;;
    const newExpenses = [...savedTransactions, formvalues];
    localStorage.setItem('expenses', JSON.stringify(newExpenses));
    e.currentTarget.reset();
    setSavedTransactions(newExpenses);
    setLoading(false);
  };

  const handleDelete = (index: number) => {
    const newExpenses = savedTransactions.filter((_, i) => i !== index);
    localStorage.setItem('expenses', JSON.stringify(newExpenses));
    setSavedTransactions(newExpenses);
  };

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) closeModal() }}
      className='fixed inset-0 top-0 left-0 flex flex-col sm:justify-center items-center z-50 backdrop-blur-md w-screen min-h-lvh'
    >
      <div className={`relative min-h-[300px] xs:h-fit max-h-[85vh] my-5 overflow-auto bg-black/50 border border-white/10 
        max-w-2xl w-[95%] p-4 xs:p-6 rounded-xl ${isClosing ? "fade-out" : "fade-in"}`}
      >
        <button
          onClick={closeModal}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <CloseIcon />
        </button>

        <h1 className='text-2xl text-white font-bold mb-5'>Expenses Manager</h1>

        <div className="flex gap-4 mb-4 border-b border-white/10">
          <button
            onClick={() => setActiveTab('saved')}
            className={`pb-2 xs:px-4 px-2 text-sm xs:text-base transition-colors ${activeTab === 'saved'
              ? 'text-purple-400 border-b-2 border-purple-400'
              : 'text-gray-400 hover:text-white'}`}
          >
            Saved Expenses
          </button>
          <button
            onClick={() => setActiveTab('add')}
            className={`pb-2 xs:px-4 px-2 text-sm xs:text-base transition-colors ${activeTab === 'add'
              ? 'text-purple-400 border-b-2 border-purple-400'
              : 'text-gray-400 hover:text-white'}`}
          >
            Add Expense
          </button>
        </div>

        {activeTab == 'add' ?
          <div className="flex flex-col gap-3">
            <h2 className="text-lg my-1 font-semibold">Add Expense Manually</h2>

            <form onSubmit={handleSubmit}>
              <input type="hidden" name="recurring" value="true" />
              <input type="hidden" name="currency" value="KES" />
              <input type="hidden" name="icon" value="💸" />
              <input
                className='form-input mb-4'
                list="categories"
                autoComplete="off"
                name="name"
                placeholder="Category"
                required
              />
              <datalist id="categories">
                <option value="Rent" />
                <option value="Gift" />
                <option value="Utilities" />
                <option value="Loan/Mortgage" />
                <option value="Food & Dining" />
                <option value="Groceries" />
                <option value="Salary" />
                <option value="Investments" />
                <option value="Transportation" />
                <option value="Fuel" />
                <option value="Healthcare" />
                <option value="Entertainment" />
                <option value="Gym & Fitness" />
                <option value="Subscriptions" />
                <option value="Education" />
                <option value="Banking Fees" />
                <option value="Travel" />
                <option value="Other" />
              </datalist>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  className='form-input'
                  type="number"
                  name="amount"
                  min={0.0000000001}
                  placeholder="Amount"
                  required
                />
                <input
                  className='form-input'
                  type="date"
                  defaultValue={new Date().toISOString().split('T')[0]}
                  name="date"
                  required
                />
                <select
                  className='form-input'
                  name="type"
                  required
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
                <input
                  className='form-input'
                  name="note"
                  placeholder="Note (optional)"
                />
              </div>

              <button
                disabled={loading}
                className='w-full mt-4 p-2.5 bg-purple-700 hover:bg-purple-600 text-white rounded-xl transition-all disabled:opacity-50'
                type="submit"
              >
                Save
              </button>
            </form>

            <p className="text-center text-sm text-gray-300 my-2">Importing will <span className="text-red-600 text-lg">overwrite</span> your saved expenses
            </p>


            {currentExpenses?.length > 0 &&
              <>
                <button
                  onClick={() => {
                    setSavedTransactions(currentExpenses);
                    localStorage.setItem('expenses', JSON.stringify(currentExpenses));
                    setActiveTab('saved');
                  }}
                  className="w-full p-2.5 bg-purple-700 hover:bg-purple-600 text-white rounded-xl transition-all flex items-center justify-center gap-2">
                  <ImportFileIcon />
                  Import Expenses from Graph
                </button>
                <p className="text-center">or</p>
              </>
            }

            <label className="p-2.5 w-fit self-center flex items-center justify-center gap-2 border-2 border-dashed border-white/10 rounded-xl hover:bg-white/5 transition-colors cursor-pointer">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />

              <ImportCsvIcon />
              <span className="text-purple-400">Import CSV</span>
            </label>
          </div> :
          savedTransactions.length > 0 ?
            <div className="flex flex-col gap-4">
              <button
                onClick={() => {
                  onViewSaved(savedTransactions);
                  closeModal()
                }}
                className="w-full p-2.5 bg-purple-700 hover:bg-purple-600 text-white rounded-xl transition-all flex items-center justify-center gap-2">
                <GraphIcon />
                View on Graph
              </button>
              <button
                onClick={() => {
                  const csv = savedTransactions.reduce((acc, curr) => {
                    return acc + `${curr.date},${curr.icon},${curr.name},${curr.note},${curr.amount},${curr.currency},${curr.type},${curr.recurring}\n`;
                  }, 'Date,Icon,Name,Note,Amount,Currency,Type,Recurring\n');
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'saved-expenses.csv';
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="text-purple-400 hover:text-purple-300 transition-all text-center underline w-full">
                Export Saved Expenses
              </button>
              <div className="flex gap-2 items-center form-input">
                🔍
                <input
                  type="text"
                  placeholder="Search"
                  value={searchTerm}
                  onChange={(e) => {
                    const search = e.target.value.toLowerCase();
                    const filtered = savedTransactions.filter((txn: Transaction) => {
                      return txn.name.toLowerCase().includes(search) || txn.note?.toLowerCase().includes(search);
                    });
                    setFilteredTransactions(filtered);
                    setSearchTerm(search);
                  }}
                  className="bg-transparent outline-none flex-grow"
                />
                {searchTerm && <button
                  onClick={() => {
                    setFilteredTransactions(savedTransactions);
                    setSearchTerm('');
                  }}
                  className="ml-auto text-gray-400 hover:text-white transition-colors"
                >
                  <CloseIcon />
                </button>}
              </div>
              <div className="max-h-[60vh] overflow-y-auto space-y-2">
                {filteredTransactions.map((expense, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-white/5 rounded-2xl"
                  >
                    <div className="flex-1">
                      <p className="text-white">{expense.name}</p>
                      <div className="flex gap-4 text-sm text-gray-400">
                        <span>KES {expense?.amount?.toLocaleString()}</span>
                        <span>{new Date(expense.date).toLocaleDateString()}</span>
                        {expense.note && <span>• {expense.note}</span>}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(index)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                    >
                      <CloseIcon />
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={() => {
                  if (!confirm('Are you sure you want to clear all saved expenses?')) return;
                  localStorage.clear();
                  setSavedTransactions([]);
                }}
                className="text-red-700 hover:text-red-600 transition-all text-center w-full">
                Clear all
              </button>
            </div> :
            <p className="text-center mt-10 text-gray-400">You have no saved expenses</p>
        }
      </div>
    </div>
  );
}