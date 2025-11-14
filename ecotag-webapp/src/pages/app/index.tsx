import { useState } from "react";
import { useSession } from "next-auth/react";

export default function App() {
    const { data: session, status } = useSession();
    const [extensionInstalled, setExtensionInstalled] = useState(false);

    return (
        <div className="min-h-screen bg-gray-50 text-gray-800">
            {/* NAVBAR */}
            <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <div className="text-2xl font-bold text-green-600">EcoTag</div>
                <div className="space-x-6 text-gray-700 font-medium flex items-center">
                    <a href="#" className="hover:text-green-600">Dashboard</a>
                    <a href="#" className="hover:text-green-600">My Scans</a>
                    <a href="#" className="hover:text-green-600">Extension</a>
                    <a href="#" className="hover:text-green-600">Settings</a>
                    {status == "authenticated" ? (<div>
                        <span className="mr-4">Hello, {session.user?.email}</span>
                        <button className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition">
                            Logout
                        </button>
                    </div>) : (<div>
                        <button className="bg-green-600 text-white px-3 py-2 mr-1 rounded-lg hover:bg-green-700 transition">
                            Sign up
                        </button>
                        <button className="bg-white text-green-600 px-3 py-2 rounded-lg border border-green-600 hover:bg-green-100 transition">
                            Log in
                        </button>
                    </div>)}
                </div>
            </nav>

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

                        <button className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition">
                            Start Barcode Scanner
                        </button>

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
                            <div className="flex justify-between bg-gray-100 p-3 rounded-lg">
                                <span>H&M Hoodie</span>
                                <span className="font-semibold text-green-600">42 / 100</span>
                            </div>

                            <div className="flex justify-between bg-gray-100 p-3 rounded-lg">
                                <span>Zara Denim Jacket</span>
                                <span className="font-semibold text-green-600">55 / 100</span>
                            </div>

                            <div className="flex justify-between bg-gray-100 p-3 rounded-lg">
                                <span>Uniqlo T-Shirt</span>
                                <span className="font-semibold text-green-600">78 / 100</span>
                            </div>
                        </div>

                        <button className="mt-4 text-green-600 hover:text-green-800 font-medium">
                            View All →
                        </button>
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
