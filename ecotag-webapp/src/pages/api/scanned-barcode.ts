import { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenAI } from '@google/genai';
import { IProduct } from '@/types/Product';
import { connectToDatabase } from '@/lib/db';
import Product from '@/models/Product';

const BARCODE_LOOKUP_KEY = "0dxggtzkpnkpjnnjcce9765tyylqxp";
const BARCODE_API_URL = "https://api.barcodelookup.com/v3/products";

const ai = new GoogleGenAI({});

// Define the structured JSON output for eco-metrics
const ECO_METRICS_SCHEMA = {
    type: "OBJECT",
    properties: {
        materials: { type: "STRING", description: "The primary materials identified for the product (e.g., '60% Cotton, 40% Polyester')." },
        co2FootprintKgPerItem: { type: "STRING", description: "The calculated CO2 footprint in kg (e.g., '3.5 kg CO2') based on materials." },
        recyclingAbilityScore: { type: "NUMBER", description: "Recycling score from 1 (low) to 10 (high)." },
        lifecycleScore: { type: "NUMBER", description: "Material lifecycle score from 1 (short) to 10 (long)." },
        ecoscore: { type: "NUMBER", description: "Overall eco-score from 1 (poor) to 100 (excellent)." },
        description: { type: "STRING", description: "A brief description of the product." },
    },
    required: ["materials", "co2FootprintKgPerItem", "recyclingAbilityScore", "lifecycleScore", "ecoscore", "description"]
};

// --- MONGODB HELPER FUNCTIONS (PLACEHOLDERS) ---

/**
 * Placeholder for your actual MongoDB connection and Product model search.
 * This should connect to the DB and use your Mongoose/Prisma/etc. Product model.
 * @param barcode The barcode ID to search for.
 */
async function findProductByBarcode(barcode: string): Promise<IProduct | null> {
    await connectToDatabase();

    console.log(`Searching MongoDB for product with barcode: ${barcode}`);
    const result = await Product.findOne({ barcode_number: barcode }).lean();
    return result as unknown as IProduct | null;
}

async function saveProduct(productData: any) {
    await connectToDatabase();

    await Product.findOneAndUpdate(
        { barcode_number: productData.barcode_number },
        productData,
        { upsert: true, new: true }
    );

    console.log(`Saving/Updating product data in MongoDB for barcode: ${productData.barcode_number}`);
}

async function fetchProductFromExternalAPI(barcode: string) {
    const url = `${BARCODE_API_URL}?barcode=${barcode}&formatted=y&key=${BARCODE_LOOKUP_KEY}`;

    console.log(`Calling external Barcode Lookup API for ${barcode}...`);
    const response = await fetch(url);
    const data = await response.json();

    if (data.products && data.products.length > 0) {
        const product = data.products[0];
        const storeLink = product.stores?.[0]?.link;

        let title;
        try {
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash-preview-09-2025",
                contents: [{ role: "user", parts: [{ text: `If the following product title isn't in English, please translate it to English: ${product.title}` }] }],
                config: {
                    // NO Google Search grounding tool, as the document is provided directly
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: "OBJECT",
                        properties: {
                            title: { type: "STRING", description: "The title you should translate to English if it's not already." },
                        },
                        required: ["title"]
                    },
                }
            });

            const jsonString = typeof response?.text === 'string' ? response.text.trim() : '';
            if (!jsonString) {
                title = product.title; // Fallback to original title
            } else {
                const parsed = JSON.parse(jsonString);
                title = parsed.title || product.title;
            }
        } catch (error) {
            console.error("Gemini Eco-Calculation failed:", error);
            title = product.title; // Fallback to original title
        }

        return {
            title: title,
            manufacturer: product.manufacturer,
            images: product.images || [],
            storeLink: storeLink, // The link to be scraped/grounded
            rawProductData: product,
            barcode_number: barcode, // Add barcode explicitly for saving
        };
    }
    return null;
}

async function calculateEcoMetrics(barcode: string, storeLink: string) {
    const systemPrompt = `You are an expert sustainability analyst. Your task is to analyze the provided store link, identify the materials of the product (e.g., cotton, polyester, leather, etc.), and calculate its environmental metrics. 
    Use the following CO2 guidelines for calculation: Cotton (2-4 kg CO2/kg), Polyester (9-12 kg CO2/kg), Leather (110-130 kg CO2/kg). 
    Base the Recycling, Lifecycle, and overall Ecoscore (1-10) on the material composition and general sustainability principles.`;

    const response = await fetch(storeLink, {
        headers: { 'User-Agent': 'Mozilla/5.0' } as HeadersInit,
    });
    const htmlData = await response.text();

    let cleanedData = htmlData.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ''); // Remove script tags
    cleanedData = cleanedData.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');   // Remove style tags
    cleanedData = cleanedData.replace(/<!--[\s\S]*?-->/g, '');                               // Remove HTML comments
    cleanedData = cleanedData.replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, ''); // Remove header tags
    cleanedData = cleanedData.replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, ''); // Remove footer tags
    cleanedData = cleanedData.replace(/<[^>]+>/g, ' '); // Replace any HTML tag with a space
    cleanedData = cleanedData.replace(/\s\s+/g, ' ').trim();

    const userPrompt = `Analyze the product page containing the following text (note: if the text is in any other language, please translate it to English) to determine the primary material composition, calculate the estimated total CO2 footprint, and assign the scores: ${cleanedData}.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-09-2025",
            contents: [{ role: "user", parts: [{ text: userPrompt }] }],
            config: {
                // NO Google Search grounding tool, as the document is provided directly
                systemInstruction: systemPrompt,
                responseMimeType: "application/json",
                responseSchema: ECO_METRICS_SCHEMA,
            }
        });

        console.log("Gemini Eco-Calculation response:", response);

        // Ensure response.text is a string before trimming/parsing
        const jsonString = typeof response?.text === 'string' ? response.text.trim() : '';
        if (!jsonString) {
            throw new Error('Empty response text from AI model');
        }
        return JSON.parse(jsonString);

    } catch (error) {
        console.error("Gemini Eco-Calculation failed:", error);
        // Return fallback scores if AI calculation fails
        return {
            materials: "Unknown (AI calculation failed)",
            co2FootprintKgPerItem: "N/A",
            recyclingAbilityScore: 5,
            lifecycleScore: 5,
            ecoscore: 5,
        };
    }
}

// --- API ROUTE HANDLER ---

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { barcode } = req.query;

    if (!barcode || typeof barcode !== 'string') {
        return res.status(400).json({ message: 'Missing barcode query parameter.' });
    }

    try {
        // 1. CHECK DATABASE (MongoDB)
        const cachedProduct = await findProductByBarcode(barcode);

        if (cachedProduct) {
            console.log("Product found in MongoDB cache.");
            return res.status(200).json({
                source: "Database Cache (MongoDB)",
                ...(cachedProduct as any)
            });
        }

        // 2. EXTERNAL API CALL (Fallback)
        let productBaseData = await fetchProductFromExternalAPI(barcode);

        if (!productBaseData) {
            return res.status(404).json({ message: 'Product not found via external lookup API.' });
        }

        let finalProductData: any = { ...productBaseData };

        // 3. AI CALCULATION (Scraping/Grounding and Metrics)
        if (productBaseData.storeLink) {
            const ecoMetrics = await calculateEcoMetrics(barcode, productBaseData.storeLink);
            finalProductData = { ...finalProductData, ...ecoMetrics };
        } else {
            console.log("No store link found. Using fallback eco-metrics.");
            finalProductData = {
                ...finalProductData,
                materials: "Unknown (No store link found)",
                co2FootprintKgPerItem: "N/A",
                recyclingAbilityScore: 5,
                lifecycleScore: 5,
                ecoscore: 5,
            };
        }

        // Ensure barcode is set for saving
        finalProductData.barcode = barcode;

        // 4. DATABASE WRITE (Cache the result in MongoDB)
        await saveProduct(finalProductData);

        console.log(`Product data and eco-metrics successfully calculated and saved to MongoDB for ${barcode}.`);

        return res.status(200).json({
            source: "External API and Gemini Calculation",
            ...finalProductData
        });

    } catch (error: any) {
        console.error('Final API Handler Error:', error.message);
        return res.status(500).json({
            message: 'Internal Server Error during product processing.',
            error: error.message
        });
    }
}