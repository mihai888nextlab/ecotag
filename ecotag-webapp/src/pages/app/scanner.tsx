import React, { useState, useEffect, useRef } from 'react';
// NOTE: This component assumes you have installed the necessary library:
// npm install @zxing/library
import { BrowserMultiFormatReader, DecodeHintType } from '@zxing/library';

// --- Main Scanner Component ---

const ScannerPage: React.FC = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [barcodeResult, setBarcodeResult] = useState<{ code: string; type: string } | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Use a ref to store the reader instance so it persists across renders
    const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);

    // Helper to stop scanning and release camera; defined at component scope so it's usable elsewhere
    const stopScanning = () => {
        if (codeReaderRef.current) {
            // Stops the decoding loop and releases the camera stream
            codeReaderRef.current.reset();
            setIsScanning(false);
            console.log("ZXing Reader stopped.");
        }
    };

    // --- Scanning Logic ---
    useEffect(() => {
        // 1. Initialize Reader
        const hints = new Map();
        // Specify the formats we care about (EAN/UPC are common product codes)
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [
            'CODE_128', 'EAN_13', 'EAN_8', 'CODE_39', 'UPC_A', 'UPC_E'
        ]);

        // Create the reader instance
        codeReaderRef.current = new BrowserMultiFormatReader(hints, 500); // 500ms between attempts

        const startScanning = async () => {
            if (!videoRef.current || !codeReaderRef.current) {
                setError("Reader initialization failed.");
                return;
            }

            setIsScanning(true);
            setError(null);
            console.log('ZXing Reader initialized. Starting stream...');

            try {
                // Request camera access and start decoding
                // Passing 'environment' forces the use of the rear camera on mobile devices
                await codeReaderRef.current.decodeFromConstraints(
                    { video: { facingMode: 'environment' } },
                    videoRef.current,
                    (result, error) => {
                        if (result) {
                            // Successfully decoded a barcode
                            console.log("Barcode detected:", result);
                            stopScanning(); // Stop stream immediately
                            setBarcodeResult({
                                code: result.getText(),
                                type: result.getBarcodeFormat().toString(),
                            });
                        }
                        // Error handling: Ignore constant "No barcode found" errors
                        // if (error && !(error instanceof NotFoundException)) {
                        //   console.error("Decoding error:", error);
                        // }
                    }
                );
            } catch (e: any) {
                console.error("Camera access failed:", e);
                setError(`Camera access failed. Check permissions or ensure running on HTTPS. Error: ${e.message}`);
                setIsScanning(false);
            }
        };

        startScanning();

        // Cleanup function: MUST stop the stream when the component unmounts
        return () => {
            stopScanning();
        };
    }, []); // Run only on initial mount

    // --- Modal Management ---

    const closeModal = () => {
        setBarcodeResult(null);
        // Restart scanning if user closes modal
        if (codeReaderRef.current) {
            // Need to re-run the decodeFromConstraints to restart the entire stream
            const startAgain = async () => {
                if (videoRef.current) {
                    try {
                        await codeReaderRef.current?.decodeFromConstraints(
                            { video: { facingMode: 'environment' } },
                            videoRef.current,
                            (result, error) => {
                                if (result) {
                                    stopScanning();
                                    setBarcodeResult({
                                        code: result.getText(),
                                        type: result.getBarcodeFormat().toString(),
                                    });
                                }
                            }
                        );
                        setIsScanning(true);
                    } catch (e) {
                        console.error("Restart failed:", e);
                        setError("Failed to restart scanner.");
                    }
                }
            };
            startAgain();
        }
    };

    // --- UI Components ---

    const ResultModal: React.FC = () => {
        if (!barcodeResult) return null;

        return (
            <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm transform transition-all duration-300 scale-100">
                    <h3 className="text-xl font-bold text-indigo-600 mb-4 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                        </svg>
                        Barcode Detected!
                    </h3>
                    <div className="space-y-2 mb-6">
                        <p className="text-sm font-medium text-gray-500">Code:</p>
                        <p className="text-2xl font-extrabold text-gray-800 tracking-wider bg-gray-100 p-2 rounded-lg break-all">
                            {barcodeResult.code}
                        </p>
                        <p className="text-sm font-medium text-gray-500">Type:</p>
                        <p className="text-lg font-semibold text-indigo-500">{barcodeResult.type}</p>
                    </div>
                    <button
                        onClick={closeModal}
                        className="w-full py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-150"
                    >
                        Scan Again
                    </button>
                </div>
            </div>
        );
    };

    // --- Main Render ---

    return (
        <div className="min-h-screen bg-gray-100 p-4 font-inter flex flex-col items-center">
            <header className="w-full max-w-2xl text-center py-4">
                <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
                    Barcode Scanner (ZXing)
                </h1>
                <p className="text-gray-600">
                    Point your device camera at a UPC or EAN barcode.
                </p>
            </header>

            <main className="w-full max-w-xl flex flex-col items-center grow">

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative w-full mb-4 shadow-md" role="alert">
                        <p className="font-bold">Error:</p>
                        <p className="text-sm">{error}</p>
                        <p className="text-xs mt-1">Please ensure you have installed the required dependencies and are running on a secure context (HTTPS/localhost).</p>
                    </div>
                )}

                <div className="relative w-full aspect-video bg-gray-800 rounded-xl overflow-hidden shadow-2xl">
                    {/* ZXing will stream the video into this standard HTML <video> element */}
                    <video
                        ref={videoRef}
                        id="scanner-video"
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                        style={{
                            height: '100%',
                            width: '100%',
                            overflow: 'hidden'
                        }}
                    />

                    {!isScanning && !error && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-70 text-white">
                            <svg className="animate-spin h-8 w-8 text-white mr-3" viewBox="0 0 24 24">...</svg>
                            Initializing Camera (ZXing)...
                        </div>
                    )}

                    {isScanning && (
                        // Focusing overlay
                        <div className="absolute inset-0 border-4 border-dashed border-red-500 pointer-events-none flex items-center justify-center">
                            <div className="w-4/5 h-1 bg-red-500 animate-pulse"></div>
                        </div>
                    )}
                </div>

                <p className={`mt-4 text-sm font-semibold ${isScanning ? 'text-green-600' : 'text-gray-500'}`}>
                    Status: {isScanning ? 'Scanning for Barcode...' : 'Camera Paused/Ready'}
                </p>

            </main>

            <ResultModal />
        </div>
    );
};

export default ScannerPage;