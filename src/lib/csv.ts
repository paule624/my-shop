// Quotes a cell when it contains the separator, a quote or a line break (RFC 4180 style)
function escapeCell(value: string): string {
  return /[";\n\r]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value
}

// Builds a CSV file and lets the browser save it. No request: the data is already in the cache.
// ";" separator and UTF-8 BOM: opens correctly (columns, accents) in a French Excel.
export function downloadCsv(fileName: string, header: string[], rows: string[][]) {
  const lines = [header, ...rows].map((row) => row.map(escapeCell).join(';'))
  const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}
