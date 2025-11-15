import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

// Define the expected structure of the product data from our API route
interface ProductData {
    title: string;
    barcodeId: string;
    summary: string;
    price: string;
    features: string[];
    searchSource: string;
}

const ProductDetailsPage: React.FC = () => {
    const router = useRouter();
    const { barcode } = router.query as { barcode?: string };
    const [product, setProduct] = useState<ProductData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!barcode) return; // Wait until router has populated the query

        const fetchProductData = async () => {
            setLoading(true);
            setError(null);

            try {
                // Call our new API route, passing the barcode as a query parameter
                //const response = await fetch(`/api/product-data?barcode=${barcode}`);
                //const data = await response.json();

                //if (!response.ok) {
                //    throw new Error(data.message || 'Failed to retrieve product data.');
                //}

                setProduct({} as ProductData);
            } catch (err: any) {
                console.error("Fetch Error:", err);
                setError(`Could not load data for barcode ${barcode}. ${err.message}`);
            } finally {
                setLoading(false);
            }
        };

        fetchProductData();
    }, [barcode]);

    // --- Loading States and Error Handling ---

    if (!barcode) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
                <p className="text-xl text-gray-500">No barcode provided in URL.</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
                <svg className="animate-spin -ml-1 mr-3 h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-xl text-gray-600">Looking up product for barcode: {barcode}...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg shadow-lg max-w-lg">
                    <p className="font-bold">Error Loading Product</p>
                    <p>{error}</p>
                    <button
                        onClick={() => router.push('/scanner')}
                        className="mt-4 text-indigo-600 hover:text-indigo-800 text-sm font-semibold"
                    >
                        Go back to Scanner
                    </button>
                </div>
            </div>
        );
    }

    // --- Main Render (Product Display) ---
    if (!product) return null;

    return (
        <div className="min-h-screen bg-gray-50 font-inter p-4 sm:p-8">
            <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">

                {/* Header Section */}
                <div className="p-6 sm:p-8 bg-indigo-600 text-white">
                    <h1 className="text-4xl font-extrabold mb-1">{product.title}</h1>
                    <p className="text-indigo-200 text-sm font-medium">Barcode ID: {product.barcodeId}</p>
                </div>

                <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Column 1: Summary and Price */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                            <p className="text-3xl font-bold text-green-700 mb-1">{product.price}</p>
                            <p className="text-sm text-green-600 font-semibold">Estimated Market Price</p>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-800 mb-2">Product Summary</h2>
                            <p className="text-gray-600 text-sm">{product.summary}</p>
                        </div>

                        <div className="text-xs text-gray-500 p-2 border-t border-gray-100">
                            Data Grounded by: {product.searchSource}
                        </div>

                        <button
                            onClick={() => router.push('/scanner')}
                            className="w-full py-3 bg-indigo-500 text-white rounded-xl font-semibold hover:bg-indigo-600 transition duration-150 shadow-md"
                        >
                            Start New Scan
                        </button>
                    </div>

                    {/* Column 2: Key Features */}
                    <div className="lg:col-span-2">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-2">Key Features & Details</h2>
                        <ul className="space-y-4">
                            {["test1", "test2", "test3"].map((feature, index) => (
                                <li key={index} className="flex items-start">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-500 mr-3 mt-1 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p className="text-gray-700">{feature}</p>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetailsPage;