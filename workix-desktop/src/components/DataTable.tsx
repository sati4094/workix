import { ReactNode, useState } from 'react';

interface Column<T> {
  key: string;
  label?: string;
  render?: (value: any, row: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[]; // The columns currently shown by default
  fullColumns?: Column<T>[]; // All possible columns (if provided, determines column options in menu)
  data: T[];
  keyExtractor: (row: T) => string;
  onRowClick?: (row: T) => void;
  actions?: (row: T) => ReactNode;
  emptyMessage?: string;
  loading?: boolean;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  fullColumns,
  data,
  keyExtractor,
  onRowClick,
  actions,
  emptyMessage = 'No data available',
  loading = false,
}: DataTableProps<T>) {
  // Use all DB columns for menu if provided
  const allCols: Column<T>[] = fullColumns && fullColumns.length > 0 ? fullColumns : columns;
  // Default-checked columns = those in columns prop
  const defaultChecked = columns.map(c => c.key);
  const [columnMenuOpen, setColumnMenuOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(defaultChecked);

  // Helper for click-outside close
  function handleDropdownBlur(e: React.FocusEvent<HTMLDivElement>) {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setColumnMenuOpen(false);
    }
  }

  // List of actually visible columns
  const filteredColumns = allCols.filter(col => visibleColumns.includes(col.key));

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="animate-pulse">
          <div className="h-12 bg-gray-200"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-50 mt-1"></div>
          ))}
        </div>
      </div>
    );
  }

  const dataArray = Array.isArray(data) ? data : [];
  if (dataArray.length === 0) {
    return (
      <div className="relative">
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-gray-400 text-lg">{emptyMessage}</div>
        </div>
        <div className="absolute top-3 right-5 z-10">
          <button
            onClick={() => setColumnMenuOpen(v => !v)}
            className="inline-flex items-center px-2 py-1 border border-gray-300 rounded bg-white text-gray-700 hover:bg-gray-100 shadow text-xs gap-1"
            aria-label="Show/Hide Columns"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
            Columns
          </button>
          {columnMenuOpen && (
            <div tabIndex={-1} className="absolute right-0 mt-1 min-w-[13rem] bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-2" onBlur={handleDropdownBlur}>
              <div className="mb-1 text-xs font-medium text-gray-700">Show/Hide Columns</div>
              {allCols.map(col => (
                <label key={col.key} className="flex items-center space-x-2 px-2 py-1 hover:bg-gray-50 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={visibleColumns.includes(col.key)}
                    disabled={filteredColumns.length === 1 && visibleColumns.includes(col.key)}
                    onChange={() => {
                      setVisibleColumns(cols =>
                        cols.includes(col.key)
                          ? cols.length > 1 ? cols.filter(k => k !== col.key) : cols
                          : [...cols, col.key]
                      );
                    }}
                    className="form-checkbox rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs text-gray-700">{col.label ?? col.key}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative bg-white rounded-lg shadow overflow-x-auto">
      <div className="absolute top-3 right-5 z-10">
        <button
          onClick={() => setColumnMenuOpen(v => !v)}
          className="inline-flex items-center px-2 py-1 border border-gray-300 rounded bg-white text-gray-700 hover:bg-gray-100 shadow text-xs gap-1"
          aria-label="Show/Hide Columns"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
          Columns
        </button>
        {columnMenuOpen && (
          <div tabIndex={-1} className="absolute right-0 mt-1 min-w-[13rem] bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-2" onBlur={handleDropdownBlur}>
            <div className="mb-1 text-xs font-medium text-gray-700">Show/Hide Columns</div>
            {allCols.map(col => (
              <label key={col.key} className="flex items-center space-x-2 px-2 py-1 hover:bg-gray-50 rounded cursor-pointer">
                <input
                  type="checkbox"
                  checked={visibleColumns.includes(col.key)}
                  disabled={filteredColumns.length === 1 && visibleColumns.includes(col.key)}
                  onChange={() => {
                    setVisibleColumns(cols =>
                      cols.includes(col.key)
                        ? cols.length > 1 ? cols.filter(k => k !== col.key) : cols
                        : [...cols, col.key]
                    );
                  }}
                  className="form-checkbox rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs text-gray-700">{col.label ?? col.key}</span>
              </label>
            ))}
          </div>
        )}
      </div>
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            {filteredColumns.map((column) => (
              <th
                key={column.key}
                className={`px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider ${column.className || ''}`}
              >
                {column.label ?? column.key}
              </th>
            ))}
            {actions && (
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {dataArray.map((row) => (
            <tr
              key={keyExtractor(row)}
              onClick={() => onRowClick?.(row)}
              className={`hover:bg-gray-50 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
            >
              {filteredColumns.map((column) => (
                <td key={column.key} className={`px-6 py-4 ${column.className || ''}`}>
                  {column.render ? column.render(row[column.key], row) : row[column.key]}
                </td>
              ))}
              {actions && (
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">{actions(row)}</div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
