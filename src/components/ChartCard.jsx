import React from 'react'

export default function ChartCard({ title }) {
  // Placeholder chart area; actual chart would render via Recharts with responsive container
  return (
    <section aria-label={title} className="bg-white/5 border border-gray-700 rounded p-4 h-48">
      <div className="font-semibold mb-2">{title}</div>
      <div className="text-sm text-gray-300">[Chart will render here]</div>
    </section>
  )
}
