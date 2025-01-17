export function CsvReader(file: File, onFinish: (transactions: Transaction[]) => void) {
  if (!file.name.endsWith('.csv')) {
    alert('Please upload a CSV file');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const text = e.target?.result as string;
    const rows = text.split('\n');
    const expectedHeaders = ['Date', 'Icon', 'Name', 'Note', 'Amount', 'Currency', 'Type', 'Recurring'];
    const headers = rows[0].split(',').map(header => header.trim());

    if (!expectedHeaders.every((header, i) => headers[i]?.toLowerCase() === header.toLowerCase())) {
      alert('Invalid CSV format. Please ensure the CSV has the following columns: ' + expectedHeaders.join(', '));
      return;
    }

    const transactions: Transaction[] = rows
      .slice(1)
      .filter(row => row.trim())
      .map(row => {
        const [date, icon, name, note, amount, currency, type, recurring] = row.split(',').map(cell => cell.trim());
        // Validate required fields
        if (!date || !name || !amount || !type) {
          throw new Error('Missing required fields');
        }
        // Validate date format
        if (isNaN(Date.parse(date))) {
          throw new Error('Invalid date format');
        }
        // Validate type
        if (type !== 'expense' && type !== 'income') {
          throw new Error('Type must be either "expense" or "income"');
        }
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
    onFinish(transactions);
  };

  reader.onerror = () => {
    alert('Error reading file');
  };
  try {
    reader.readAsText(file);
  } catch (error) {
    alert('Error processing file: ' + (error as Error).message);
  }
}