import React from "react";

export interface DataTableColumn<T> {
  /** Header label. */
  header: string;
  /** Cell renderer. */
  cell: (row: T, index: number) => React.ReactNode;
  /** Optional fixed/min width. */
  width?: number | string;
  /** Right-align (for numbers). */
  align?: "left" | "right";
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  /** Optional row click handler. */
  onRowClick?: (row: T, index: number) => void;
}

/**
 * DataTable — minimal generic table with the Bonsai styling.
 *
 * @example
 * <DataTable
 *   columns={[
 *     { header: "Empleado", cell: (r) => r.name },
 *     { header: "Progreso", cell: (r) => r.pct + "%", align: "right" },
 *   ]}
 *   rows={people}
 * />
 */
export function DataTable<T>({ columns, rows, onRowClick }: DataTableProps<T>) {
  return (
    <table className="dtable">
      <thead>
        <tr>
          {columns.map((c, i) => (
            <th key={i} style={{ width: c.width, textAlign: c.align ?? "left" }}>
              {c.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, ri) => (
          <tr
            key={ri}
            onClick={onRowClick ? () => onRowClick(row, ri) : undefined}
            style={{ cursor: onRowClick ? "pointer" : undefined }}
          >
            {columns.map((c, ci) => (
              <td key={ci} style={{ textAlign: c.align ?? "left" }}>
                {c.cell(row, ri)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default DataTable;
