import React from 'react'

export default function LeftNav() {
  return (
    <nav aria-label="Main navigation" className="space-y-2">
      <a href="#" className="block px-3 py-2 rounded hover:bg-gray-700">Dashboard</a>
      <a href="#" className="block px-3 py-2 rounded hover:bg-gray-700">Students</a>
      <a href="#" className="block px-3 py-2 rounded hover:bg-gray-700">Classes</a>
      <a href="#" className="block px-3 py-2 rounded hover:bg-gray-700">Settings</a>
    </nav>
  )
}
