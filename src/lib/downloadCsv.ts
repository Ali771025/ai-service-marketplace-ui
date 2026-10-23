/**
 * CSV download helper for MVP mock — UTF-8 BOM so Excel opens Persian headers correctly.
 * Not a real Reporting service; client-side blob only.
 */

export type CsvCell = string | number | null | undefined

function escapeCsvCell(value: CsvCell): string {
  const raw = value == null ? '' : String(value)
  if (/[",\r\n]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`
  }
  return raw
}

/** Build CSV text with optional UTF-8 BOM (default on). */
export function buildCsv(
  headers: string[],
  rows: CsvCell[][],
  opts?: { bom?: boolean },
): string {
  const lines = [
    headers.map(escapeCsvCell).join(','),
    ...rows.map((row) => row.map(escapeCsvCell).join(',')),
  ]
  const body = lines.join('\r\n')
  return (opts?.bom === false ? '' : '\uFEFF') + body
}

/** Trigger browser download of a CSV string. */
export function downloadCsvFile(filename: string, csvText: string): void {
  const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export function downloadCsv(
  filename: string,
  headers: string[],
  rows: CsvCell[][],
): void {
  downloadCsvFile(filename, buildCsv(headers, rows))
}
