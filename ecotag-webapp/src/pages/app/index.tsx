import { useState } from "react";
import { useSession } from "next-auth/react";
import Link from 'next/link'
import { SAMPLE_SCANS } from '../../data/sampleScans'

export default function App() {
    const { data: session, status } = useSession();
    const [extensionInstalled, setExtensionInstalled] = useState(false);

    return (
        <div className="min-h-screen bg-gray-50 text-gray-800">
            {/* Header is provided globally via the shared Header component */}

            <main className="max-w-5xl mx-auto py-10 px-4">

                {/* HEADER */}
                <div className="mb-10">
                    <h1 className="text-3xl font-bold text-gray-900">
                        Welcome to your EcoTag Dashboard 🌱
                    </h1>
                    <p className="text-gray-600 mt-2">
                        Scan barcodes, track your sustainability impact, and manage your EcoScore history.
                    </p>
                </div>

                {/* GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* BARCODE SCANNER CTA */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                        <h2 className="text-xl font-semibold mb-2">Scan a Product</h2>
                        <p className="text-gray-600 mb-4">
                            Use your camera or manually enter an EAN barcode to get the EcoScore.
                        </p>

                        <Link href="/app/scanner" className="w-full inline-block text-center bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition">
                            Start Barcode Scanner
                        </Link>

                        <button className="w-full mt-3 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition">
                            Enter EAN Manually
                        </button>
                    </div>

                    {/* ECOSCORE SUMMARY */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                        <h2 className="text-xl font-semibold mb-2">Your Sustainability Summary</h2>
                        <p className="text-gray-600 mb-4">
                            Overview of your shopping footprint this month.
                        </p>

                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                                <p className="text-2xl font-bold text-green-600">65</p>
                                <p className="text-sm text-gray-600">Avg Score</p>
                            </div>
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                <p className="text-2xl font-bold text-blue-600">12</p>
                                <p className="text-sm text-gray-600">Items Scanned</p>
                            </div>
                            <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                                <p className="text-2xl font-bold text-amber-600">2.1kg</p>
                                <p className="text-sm text-gray-600">CO₂ Saved</p>
                            </div>
                        </div>
                    </div>

                    {/* LATEST SCANS */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 md:col-span-2">
                        <h2 className="text-xl font-semibold mb-4">Latest Scans</h2>

                        <div className="space-y-3">
                            {SAMPLE_SCANS.map((s, i) => (
                                <div key={i} className="flex justify-between bg-gray-100 p-3 rounded-lg">
                                    <span>{s.title}</span>
                                    <span className="font-semibold text-green-600">{s.score} / 100</span>
                                </div>
                            ))}
                        </div>

                        <Link href="/app/history" className="mt-4 inline-block text-green-600 hover:text-green-800 font-medium">
                            View All →
                        </Link>
                    </div>

                    {/* EXTENSION STATUS */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                        <h2 className="text-xl font-semibold mb-2">Browser Extension</h2>

                        <p className="text-gray-600 mb-4">
                            Status:{" "}
                            <strong className={extensionInstalled ? "text-green-600" : "text-red-500"}>
                                {extensionInstalled ? "Installed" : "Not Installed"}
                            </strong>
                        </p>

                        <button className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition">
                            Install Chrome Extension
                        </button>
                    </div>

                </div>
            </main>
        </div>
    );
}
