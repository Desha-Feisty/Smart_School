import React from 'react'
import DashboardLayout from '../layout/DashboardLayout.jsx'
import LeftNav from '../components/LeftNav.jsx'
import AppHeader from '../components/AppHeader.jsx'
import RightPanel from '../components/RightPanel.jsx'
import SummaryCard from '../components/SummaryCard.jsx'
import DataTable from '../components/DataTable.jsx'
import ChartCard from '../components/ChartCard.jsx'

// Simple in-memory data for demonstration
const sampleData = Array.from({ length: 60 }).map((_, i) => ({ id: i + 1, name: `Student ${i + 1}`, score: Math.round(Math.random() * 100) }))

export default function DashboardPage() {
  return (
    <DashboardLayout LeftNav={LeftNav} RightPanel={RightPanel} Header={AppHeader}>
      <section className="flex flex-wrap gap-4 items-stretch pb-4" aria-label="Summary">
        <SummaryCard title="Revenue" value="$120k" />
        <SummaryCard title="Active Users" value="3.2k" />
        <SummaryCard title="Conversion" value="4.5%" />
      </section>
      <section className="py-2" aria-label="Primary toolbar">
        {/* Placeholder for primary actions */}
        <div className="flex space-x-2">
          <button className="btn btn-primary">Add</button>
          <button className="btn">Export</button>
          <button className="btn">Filter</button>
        </div>
      </section>

      <section aria-label="Charts and Tables" className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Enrollment Trends" />
        <DataTable items={sampleData} perPage={10} />
      </section>
    </DashboardLayout>
  )
}
