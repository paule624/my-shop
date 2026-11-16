import type { ReactNode } from 'react'

export type Column<T> = {
  header: string
  cell: (row: T) => ReactNode
  // Header only announced to screen readers (e.g. an actions column)
  hiddenHeader?: boolean
}

type DataTableProps<T> = {
  // Table name, read by screen readers (visually hidden)
  caption: string
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => string
  emptyMessage: string
}

// Generic table: products today, orders tomorrow. Real <table> semantics (caption, th scope)
// so screen readers announce each cell with its column header.
function DataTable<T>({ caption, columns, rows, rowKey, emptyMessage }: DataTableProps<T>) {
  if (rows.length === 0) return <p className="fetch-message">{emptyMessage}</p>

  return (
    // Horizontal scroll on small screens; focusable so keyboard users can scroll it too
    <div className="table-scroll" role="region" aria-label={caption} tabIndex={0}>
      <table className="data-table">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.header} scope="col">
                {column.hiddenHeader ? <span className="sr-only">{column.header}</span> : column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)}>
              {columns.map((column) => <td key={column.header}>{column.cell(row)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default DataTable
