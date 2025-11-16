import React from 'react';
import { useRouter } from 'next/router';
import type { GetServerSideProps } from 'next';
import { IProduct } from '../../../types/Product';

type PageProps = {
    product?: IProduct | null;
    error?: string | null;
    barcode: string;
};

const ProductDetailsPage: React.FC<PageProps> = ({ product, error, barcode }) => {
    const router = useRouter();

    // --- Loading States and Error Handling ---

    if (!barcode) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
                <p className="text-xl text-gray-500">No barcode provided in URL.</p>
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
    if (!product) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
                <p className="text-lg text-gray-600">No product data found for barcode: {barcode}</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 font-inter p-4 sm:p-8">
            <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">

                {/* Header Section */}
                <div className="p-6 sm:p-8 bg-indigo-600 text-white">
                    <div className="flex items-start gap-6">
                        <div className="flex-1">
                            <h1 className="text-4xl font-extrabold mb-1">{product.title}</h1>
                            <p className="text-indigo-200 text-sm font-medium">Barcode ID: {product.barcode_number}</p>
                        </div>
                        <div className="w-28 h-28 rounded-lg overflow-hidden bg-white/10 shrink-0">
                            {product.images && product.images.length > 0 ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={product.images[0]} alt={product.title || 'product image'} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-sm text-white/80">No image</div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Column 1: Image, Ecoscore and Summary */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="p-4 bg-white rounded-xl border border-gray-200">
                            <h3 className="text-sm text-gray-500 font-semibold">Overall EcoScore</h3>
                            <p className="text-4xl font-extrabold text-green-700 mt-2">{product.ecoscore ?? '—'}</p>
                            <div className="mt-3 text-sm text-gray-600 space-y-1">
                                <div>Recycling Ability: <strong>{product.recyclingAbilityScore ?? '—'}</strong></div>
                                <div>Lifecycle Score: <strong>{product.lifecycleScore ?? '—'}</strong></div>
                                <div>CO₂ Footprint (kg/item): <strong>{product.co2FootprintKgPerItem ?? '—'}</strong></div>
                            </div>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-800 mb-2">Description</h2>
                            <p className="text-gray-600 text-sm whitespace-pre-line">{product.description}</p>
                        </div>

                        <div className="text-xs text-gray-500 p-2 border-t border-gray-100">
                            Data Grounded by: {/* if available, show a source */}
                            {" "}{(product as any).searchSource ?? 'unknown'}
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

export const getServerSideProps: GetServerSideProps<PageProps> = async (context) => {
    const rawParam = context.params?.barcode;
    const barcode = Array.isArray(rawParam) ? rawParam[0] : rawParam;

    if (!barcode) {
        return { notFound: true };
    }

    // Build absolute URL to internal API. Prefer NEXT_PUBLIC_SITE_URL if configured.
    const host = context.req.headers.host;
    const forwardedProto = context.req.headers['x-forwarded-proto'] as string | undefined;
    const proto = forwardedProto ? forwardedProto.split(',')[0] : 'http';
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || (host ? `${proto}://${host}` : '');

    const apiUrl = `${baseUrl}/api/scanned-barcode?barcode=${encodeURIComponent(String(barcode))}`;

    try {
        const r = await fetch(apiUrl);
        const data = await r.json().catch(() => null);

        if (!r.ok) {
            return { props: { product: null, error: data?.message || `Upstream returned ${r.status}`, barcode: String(barcode) } };
        }

        // If the API returns an object with a `product` key, use it; otherwise use the whole body.
        const product = data?.product ?? data ?? null;

        console.log("Fetched product data:", product);

        return { props: { product, error: null, barcode: String(barcode) } };
    } catch (err: any) {
        return { props: { product: null, error: String(err?.message ?? err), barcode: String(barcode) } };
    }
};