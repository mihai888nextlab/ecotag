import { Document } from 'mongoose';

export interface IProduct extends Document {
    barcode_number: number;
    mpn: string;
    asin: string;
    title: string;
    category: string;
    manufacturer: string;
    brand: string;
    age_group: string;
    color: string;
    gender: string;
    material: string;
    size: string;
    description: string;
    images: string[],
    materials: string;
    co2FootprintKgPerItem: string;
    recyclingAbilityScore: number;
    lifecycleScore: number;
    ecoscore: number;
    createdAt: Date;
    updatedAt: Date;
}