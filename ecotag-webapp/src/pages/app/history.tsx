import React from 'react'
import { SAMPLE_SCANS } from '../../data/sampleScans'

export default function History() {
    return (
        <div className="min-h-screen bg-gray-50 text-gray-800">
            <main className="max-w-5xl mx-auto py-10 px-4">

                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">Scan History</h1>
                    <p className="text-gray-600 mt-2">A list of your recent scans.</p>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                            <h2 className="text-xl font-semibold">Scans</h2>

                            {/* Search bar (non-functional) aligned on the same row */}
                            <div className="w-full md:w-80">
                                <label htmlFor="scan-search" className="sr-only">Search scans</label>
                                <div className="relative">
                                    <input
                                        id="scan-search"
                                        type="text"
                                        placeholder="Search scans"
                                        className="w-full pl-3 pr-10 py-3 rounded-lg border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-1 focus:ring-green-300"
                                    />
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                                            <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                            <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="1.5" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                    <div className="space-y-4">
                        {SAMPLE_SCANS.map((s, i) => (
                            <div
                                key={i}
                                className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm border border-transparent hover:shadow-md transform transition hover:-translate-y-1"
                            >
                                <div>
                                    <div className="font-medium text-gray-900">{s.title}</div>
                                    {s.date && (
                                        <div className="text-sm text-gray-500 mt-1">
                                            {new Date(s.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                        </div>
                                    )}
                                </div>

                                <div className="text-sm font-semibold text-green-600">{s.score} / 100</div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    )
}
