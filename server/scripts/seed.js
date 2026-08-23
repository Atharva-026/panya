import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "../models/Product.js";
import MerchantRule from "../models/MerchantRule.js";
dotenv.config();

const products = [
  { name: "Red Running Shoe (Size 9)", price: 2499, category: "footwear", stock: 15 },
  { name: "Cotton Ankle Socks (Pack of 3)", price: 299, category: "accessories", stock: 50 },
  { name: "Blue Denim Jacket", price: 3499, category: "outerwear", stock: 10 },
  { name: "Wireless Earbuds", price: 1999, category: "electronics", stock: 20 },
  { name: "Phone Cover", price: 399, category: "accessories", stock: 40 },
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  await Product.deleteMany({});
  await Product.insertMany(products);
  await MerchantRule.deleteMany({});
  await MerchantRule.create({ maxOrderValue: 5000, dailySpendCap: 15000 });
  console.log("Seeded products + merchant rules");
  process.exit();
}
seed();