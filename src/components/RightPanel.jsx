import React from 'react'

export default function RightPanel() {
  return (
    <div className="space-y-4">
      <section aria-label="Filters" className="p-4 bg-gray-800 rounded">
        <h4 className="font-semibold mb-2">Filters</h4>
        <div className="text-sm text-gray-300">Date range, status, etc.</div>
      </section>
      <section aria-label="Notifications" className="p-4 bg-gray-800 rounded">
        <h4 className="font-semibold mb-2">Notifications</h4>
        <div className="text-sm text-gray-300">No new notifications</div>
      </section>
    </div>
  )
}
