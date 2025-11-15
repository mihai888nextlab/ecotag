import { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { prompt } = req.body;

    if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ message: 'Missing or invalid prompt in request body.' });
    }

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-09-2025",
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            config: {
                systemInstruction: "You are a helpful and concise chatbot. Respond clearly and accurately.",
            }
        });

        const generatedText = response.text;

        if (!generatedText) {
            return res.status(500).json({
                message: 'Could not generate content. Response may have been blocked due to safety settings.',
            });
        }

        return res.status(200).json({ response: generatedText });

    } catch (error: any) {
        // The SDK throws standardized errors, making error handling cleaner
        console.error('Gemini API SDK Error:', error.message);
        return res.status(500).json({
            message: 'Internal Server Error during chat generation using the SDK.',
            error: error.message
        });
    }
}