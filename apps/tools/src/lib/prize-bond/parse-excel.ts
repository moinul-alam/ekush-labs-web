import { banglaToEnglishDigits } from './parse-input';

export interface ExcelParseResult {
  numbers: string[];
  sheetsScanned: number;
  totalCellsChecked: number;
  duplicateCount: number;
  ignoredCount: number;
  error?: string;
}

/**
 * Lazy loads SheetJS (xlsx) from the bundled dependency or dynamic import.
 * Parses all sheets, extracting any valid 7-digit numbers even if stored as numbers with lost leading zeros.
 */
export async function parseExcelOrCsvFile(file: File): Promise<ExcelParseResult> {
  try {
    // Dynamic import of xlsx ensures SheetJS is only loaded when user actually uses this tab
    const XLSX = await import('xlsx');
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });

    const seen = new Set<string>();
    const numbers: string[] = [];
    let duplicateCount = 0;
    let ignoredCount = 0;
    let totalCellsChecked = 0;

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      if (!sheet) continue;

      const jsonData: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true });

      for (const row of jsonData) {
        if (!Array.isArray(row)) continue;
        for (const cell of row) {
          totalCellsChecked++;
          if (cell === null || cell === undefined || cell === '') continue;

          let cellStr = String(cell).trim();
          cellStr = banglaToEnglishDigits(cellStr);

          // Remove any text/series prefix or symbols
          const digitsOnly = cellStr.replace(/\D/g, '');

          // If valid digit string with length between 1 and 7
          if (digitsOnly.length > 0 && digitsOnly.length <= 7) {
            const padded = digitsOnly.padStart(7, '0');
            if (seen.has(padded)) {
              duplicateCount++;
            } else {
              seen.add(padded);
              numbers.push(padded);
            }
          } else if (digitsOnly.length > 7) {
            ignoredCount++;
          }
        }
      }
    }

    return {
      numbers,
      sheetsScanned: workbook.SheetNames.length,
      totalCellsChecked,
      duplicateCount,
      ignoredCount,
    };
  } catch (err: any) {
    return {
      numbers: [],
      sheetsScanned: 0,
      totalCellsChecked: 0,
      duplicateCount: 0,
      ignoredCount: 0,
      error: err?.message || 'Failed to parse file.',
    };
  }
}

/**
 * Generates and triggers download of a clean CSV / Excel template.
 */
export function downloadSampleTemplate(): void {
  const sampleContent = 'Bond Number / বন্ড নম্বর\n0806964\n0144370\n0307973\n0922432\n0578366\n0013587\n';
  const blob = new Blob(['\uFEFF' + sampleContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'sample_prize_bond_list.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
