import React from 'react'

export default function AppHeader() {
  return (
    <header className="bg-gray-900 border-b border-gray-700 px-4 py-3 sticky top-0 z-20" role="banner">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button aria-label="Open navigation" className="md:hidden btn btn-ghost">☰</button>
          <span className="text-xl font-semibold">SchoolApp Dashboard</span>
        </div>
        <div className="flex items-center space-x-2">
          <input aria-label="Search" placeholder="Search" className="input input-bordered w-48" />
          <button aria-label="Profile" className="btn btn-ghost">Profile</button>
        </div>
      </div>
    </header>
  )
}
