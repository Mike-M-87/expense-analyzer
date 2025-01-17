
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