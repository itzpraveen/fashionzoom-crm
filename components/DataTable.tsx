export function DataTable({ columns, children, colClasses = [], sticky = true }: { columns: string[]; children: React.ReactNode; colClasses?: string[]; sticky?: boolean }) {
  return (
    <div className="overflow-auto">
      <table className="min-w-full text-sm table-fixed">
        <thead className={`text-left text-muted ${sticky ? 'sticky top-0 bg-surface/95 backdrop-blur z-10 border-b border-line' : ''}`}>
          <tr>
            {columns.map((c, i) => (
              <th key={c} className={`py-2 font-medium ${colClasses[i] || ''}`}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {children}
        </tbody>
      </table>
    </div>
  )
}
