import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const response = await fetch('https://www.hugoboss.com/ro/en/logo-detail-beanie-hat-in-cotton-and-virgin-wool/hbeu50499423_358.html', {
        headers: { 'User-Agent': 'Mozilla/5.0' } as HeadersInit,
    });
    const htmlData = await response.text();

    // Regular expression to remove script, style, header, and now footer tags
    let cleanedData = htmlData.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ''); // Remove script tags
    cleanedData = cleanedData.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');   // Remove style tags
    cleanedData = cleanedData.replace(/<!--[\s\S]*?-->/g, '');                               // Remove HTML comments
    cleanedData = cleanedData.replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, ''); // Remove header tags
    cleanedData = cleanedData.replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, ''); // Remove footer tags

    // Remove other common tags, keeping only their inner text
    cleanedData = cleanedData.replace(/<[^>]+>/g, ' '); // Replace any HTML tag with a space

    // Normalize whitespace: replace multiple spaces/newlines with a single space
    cleanedData = cleanedData.replace(/\s\s+/g, ' ').trim();

    res.status(200).json({ data: cleanedData });
}