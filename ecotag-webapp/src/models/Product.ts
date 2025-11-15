import mongoose, { Schema, Model, model } from 'mongoose';
import { IProduct } from '../types/Product'; // Import the interface from above
import { IUser } from '@/types/User';

// 1. Define the Schema
const ProductSchema: Schema<IProduct> = new Schema<IProduct>({
    barcode_number: Number,
    mpn: String,
    asin: String,
    title: String,
    category: String,
    manufacturer: String,
    brand: String,
    age_group: String,
    color: String,
    gender: String,
    material: String,
    size: String,
    description: String,
    images: [String],
    materials: String,
    co2FootprintKgPerItem: String,
    recyclingAbilityScore: Number,
    lifecycleScore: Number,
    ecoscore: Number,
}, {
    timestamps: true
});


// 2. Define the Model
// Check if the model already exists to prevent re-compilation in Next.js hot reload
const Product: Model<IProduct> =
    (mongoose.models.Products as Model<IProduct>) ||
    model<IProduct>('Products', ProductSchema);

export default Product;