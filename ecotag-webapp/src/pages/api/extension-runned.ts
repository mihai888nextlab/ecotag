import { NextApiRequest, NextApiResponse } from "next";
import { GoogleGenAI } from '@google/genai';
import { connectToDatabase } from '@/lib/db';
import Product from '@/models/Product';

const ai = new GoogleGenAI({});

// Schema for the eco metrics we expect back from the model
const ECO_METRICS_SCHEMA = {
    type: "OBJECT",
    properties: {
        materials: { type: "STRING", description: "Primary materials identified for the product (e.g., '60% Cotton, 40% Polyester')." },
        co2FootprintKgPerItem: { type: "STRING", description: "Estimated CO2 footprint in kg (e.g., '3.5 kg CO2')." },
        recyclingAbilityScore: { type: "NUMBER", description: "Recycling score from 1 (low) to 10 (high)." },
        lifecycleScore: { type: "NUMBER", description: "Material lifecycle score from 1 (short) to 10 (long)." },
        ecoscore: { type: "NUMBER", description: "Overall eco-score from 1 (poor) to 100 (excellent)." },
        description: { type: "STRING", description: "A brief description of the product." },
    },
    required: ["materials", "co2FootprintKgPerItem", "recyclingAbilityScore", "lifecycleScore", "ecoscore", "description"]
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    // Accept parameters passed by the extension or caller
    const { storeLink: storeLinkParam, barcode: barcodeParam, title: titleParam, image: imageParam, manufacturer: manufacturerParam } = req.query;
    const storeLink = typeof storeLinkParam === 'string' ? storeLinkParam : (Array.isArray(storeLinkParam) ? storeLinkParam[0] : undefined);
    const barcode = typeof barcodeParam === 'string' ? barcodeParam : (Array.isArray(barcodeParam) ? barcodeParam[0] : undefined);
    const title = typeof titleParam === 'string' ? titleParam : (Array.isArray(titleParam) ? titleParam[0] : undefined);
    const image = typeof imageParam === 'string' ? imageParam : (Array.isArray(imageParam) ? imageParam[0] : undefined);
    const manufacturer = typeof manufacturerParam === 'string' ? manufacturerParam : (Array.isArray(manufacturerParam) ? manufacturerParam[0] : undefined);

    // Build a text source to analyze: prefer scraping the storeLink if provided
    let sourceText = '';
    let scraped = false;

    if (storeLink) {
        try {
            const resp = await fetch(storeLink, { headers: { 'User-Agent': 'Mozilla/5.0' } as HeadersInit });
            const htmlData = await resp.text();

            let cleanedData = htmlData.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ''); // Remove script tags
            cleanedData = cleanedData.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');   // Remove style tags
            cleanedData = cleanedData.replace(/<!--[\s\S]*?-->/g, '');                               // Remove HTML comments
            cleanedData = cleanedData.replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, ''); // Remove header tags
            cleanedData = cleanedData.replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, ''); // Remove footer tags
            cleanedData = cleanedData.replace(/<[^>]+>/g, ' '); // Replace any HTML tag with a space
            cleanedData = cleanedData.replace(/\s\s+/g, ' ').trim();

            sourceText = cleanedData;
            scraped = true;
        } catch (err) {
            console.error('Failed to fetch/clean storeLink:', err);
            // fallback to using provided fields
        }
    }

    if (!sourceText) {
        // Build a compact textual description from provided fields to feed the model
        const parts: string[] = [];
        if (title) parts.push(`Title: ${title}`);
        if (manufacturer) parts.push(`Manufacturer: ${manufacturer}`);
        if (image) parts.push(`Image URL: ${image}`);
        if (barcode) parts.push(`Barcode: ${barcode}`);
        sourceText = parts.join(' \n ');
    }

    // Prepare system prompt guiding the model to compute eco-metrics
    const systemPrompt = `You are an expert sustainability analyst. Analyze the provided product text and return a JSON object matching the required eco-metrics schema. If the text includes non-English content, translate to English before analysis. Use reasonable assumptions if necessary.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-09-2025",
            contents: [{ role: "user", parts: [{ text: `Analyze the following product content and return materials, co2FootprintKgPerItem, recyclingAbilityScore (1-10), lifecycleScore (1-10), ecoscore (1-100), and a short description in JSON: ${sourceText}` }] }],
            config: {
                systemInstruction: systemPrompt,
                responseMimeType: "application/json",
                responseSchema: ECO_METRICS_SCHEMA,
            }
        });

        const jsonString = typeof response?.text === 'string' ? response.text.trim() : '';
        if (!jsonString) {
            throw new Error('Empty response from AI model');
        }
        const metrics = JSON.parse(jsonString);

        const result = {
            barcode: barcode ?? null,
            title: title ?? null,
            manufacturer: manufacturer ?? null,
            image: image ? [image] : [],
            storeLink: storeLink ?? null,
            scraped: scraped,
            sourceTextSnippet: sourceText?.slice(0, 200),
            ...metrics,
        };

        // If we have a barcode, check DB first and save if missing
        if (barcode) {
            try {
                await connectToDatabase();
                const existing = await Product.findOne({ barcode_number: barcode }).lean();
                if (existing) {
                    return res.status(200).json({ source: 'Database Cache (MongoDB)', ...(existing as any) });
                }

                // Save the result to the DB (upsert)
                const toSave = {
                    barcode_number: isNaN(Number(barcode)) ? barcode : Number(barcode),
                    title: result.title,
                    manufacturer: result.manufacturer,
                    images: result.image ?? [],
                    materials: result.materials ?? undefined,
                    co2FootprintKgPerItem: result.co2FootprintKgPerItem ?? undefined,
                    recyclingAbilityScore: result.recyclingAbilityScore ?? undefined,
                    lifecycleScore: result.lifecycleScore ?? undefined,
                    ecoscore: result.ecoscore ?? undefined,
                    description: result.description ?? undefined,
                } as any;

                await Product.findOneAndUpdate(
                    { barcode_number: toSave.barcode_number },
                    toSave,
                    { upsert: true, new: true }
                );

                return res.status(200).json({ source: 'Saved to MongoDB', ...result });
            } catch (dbErr) {
                console.error('DB error in extension-runned:', dbErr);
                // return result but indicate DB issue
                return res.status(200).json({ source: 'AI Result (db error)', ...result, dbError: String(dbErr) });
            }
        }

        return res.status(200).json(result);
    } catch (err) {
        console.error('AI calculation failed in extension-runned:', err);
        // Fallback: return best-effort data with defaults
        const fallback = {
            barcode: barcode ?? null,
            title: title ?? null,
            manufacturer: manufacturer ?? null,
            image: image ? [image] : [],
            storeLink: storeLink ?? null,
            scraped: scraped,
            sourceTextSnippet: sourceText?.slice(0, 200),
            materials: 'Unknown (AI failed)',
            co2FootprintKgPerItem: 'N/A',
            recyclingAbilityScore: 5,
            lifecycleScore: 5,
            ecoscore: 5,
            description: title ?? '',
        };

        return res.status(200).json(fallback);
    }
}