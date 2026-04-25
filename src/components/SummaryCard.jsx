import React from 'react'

export default function SummaryCard({ title, value }) {
  return (
    <article className="flex-1 bg-white/5 border border-gray-700 rounded p-4 w-full md:w-1/3" aria-label={title} style={{ minWidth: 0 }}>
      <div className="text-sm text-gray-300">{title}</div>
      <div className="text-xl font-semibold">{value}</div>
    </article>
  )
}
