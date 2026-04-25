import React from 'react'

export default function DashboardLayout({ LeftNav, RightPanel, Header, children }) {
  const Left = LeftNav || (() => null)
  const Right = RightPanel || (() => null)
  const Top = Header || (() => null)
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-gray-100">
      <Top />
      <div className="flex h-full">
        <aside className="hidden lg:block w-1/6 bg-gray-850 p-4 border-r border-gray-700" aria-label="Main navigation"><Left /></aside>
        <main className="flex-1 p-4 w-full">
          {children}
        </main>
        <aside className="hidden lg:block w-1/6 bg-gray-850 p-4 border-l border-gray-700" aria-label="Right panel"><Right /></aside>
      </div>
    </div>
  )
}
