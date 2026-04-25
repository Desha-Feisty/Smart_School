import React, { useMemo, useState } from 'react'

export default function DataTable({ items = [], perPage = 10 }) {
  const [page, setPage] = useState(1)
  const total = items.length
  const pages = Math.max(1, Math.ceil(total / perPage))
  const current = useMemo(() => {
    const start = (page - 1) * perPage
    return items.slice(start, start + perPage)
  }, [page, perPage, items])

  return (
    <section aria-label="Data table" className="bg-white/5 border border-gray-700 rounded p-4 w-full">
      <div className="font-semibold mb-2">Data Table</div>
      <table className="min-w-full text-sm" aria-label="Data table">
        <thead>
          <tr>
            <th className="text-left p-2">ID</th>
            <th className="text-left p-2">Name</th>
            <th className="text-left p-2">Score</th>
          </tr>
        </thead>
        <tbody>
          {current.map((r) => (
            <tr key={r.id} className="odd:bg-gray-800/40">
              <td className="p-2">{r.id}</td>
              <td className="p-2">{r.name}</td>
              <td className="p-2">{r.score}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex justify-end items-center gap-2 mt-2">
        <button className="btn" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>Prev</button>
        <span className="text-sm text-gray-300">Page {page} of {pages}</span>
        <button className="btn" onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page >= pages}>Next</button>
      </div>
    </section>
  )
}
