export function CsvReader(file: File, onFinish: (transactions: Transaction[]) => void) {
  if (!file.name.endsWith('.csv')) {
    alert('Please upload a CSV file');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const text = e.target?.result as string;
    const rows = text.split('\n').filter(row => row.trim());
    if (rows.length === 0) {
      throw new Error('CSV is empty');
    }

    // Normalize headers (to lowercase)
    const rawHeaders = rows[0].split(',').map(header => header.trim().toLowerCase());

    // Define mapping: CSV header name -> Transaction key.
    const headerMapping: { [key: string]: string } = {
      'date': 'date',
      'icon': 'icon',              // old format
      'name': 'name',              // old format
      'source icon': 'icon',       // new format (alternative for icon)
      'source name': 'name',       // new format (alternative for name)
      'destination icon': 'destinationIcon', // additional new field
      'destination name': 'destinationName',   // new field for name in new format
      'note': 'note',
      'amount': 'amount',
      'currency': 'currency',
      'type': 'type',
      'recurring': 'recurring'
    };

    // Build a mapping from Transaction key to CSV column index.
    const indexMap: { [key: string]: number } = {};
    rawHeaders.forEach((header, i) => {
      if (headerMapping[header] && indexMap[headerMapping[header]] === undefined) {
        indexMap[headerMapping[header]] = i;
      }
    });

    // Ensure required fields exist (date, name, amount, type)
    const requiredKeys = ['date', 'name', 'amount', 'type'];
    for (const key of requiredKeys) {
      if (indexMap[key] === undefined) {
        throw new Error(`CSV missing required field: ${key}`);
      }
    }

    // Process each row (skipping header)
    const transactions: Transaction[] = rows.slice(1).map((row) => {
      const cells = row.split(',').map(cell => cell.trim());

      const date = cells[indexMap['date']];
      const amountStr = cells[indexMap['amount']];
      const txnType = cells[indexMap['type']];

      // If destinationName exists and isn't empty, use it; otherwise, use name.
      const destinationName = indexMap['destinationName'] !== undefined ? cells[indexMap['destinationName']] : '';
      const nameFromCSV = cells[indexMap['name']];
      const name = destinationName || nameFromCSV;

      // Validate required fields.
      if (!date || !name || !amountStr || !txnType) {
        throw new Error('Missing required fields');
      }
      if (isNaN(Date.parse(date))) {
        throw new Error('Invalid date format');
      }
      if (txnType !== 'expense' && txnType !== 'income') {
        throw new Error('Type must be either "expense" or "income"');
      }

      // Construct the Transaction.
      const transaction: Transaction = {
        date,
        icon: indexMap['icon'] !== undefined ? cells[indexMap['icon']] : '',
        name,
        note: indexMap['note'] !== undefined ? cells[indexMap['note']] : '',
        amount: parseFloat(amountStr) || 0,
        currency: indexMap['currency'] !== undefined ? cells[indexMap['currency']] : '',
        type: txnType as 'expense' | 'income',
        recurring: indexMap['recurring'] !== undefined ? cells[indexMap['recurring']] : ''
      };

      if (indexMap['destinationIcon'] !== undefined) {
        (transaction as any).destinationIcon = cells[indexMap['destinationIcon']];
      }

      return transaction;
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