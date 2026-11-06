import "dotenv/config";
import mongoose from "mongoose";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import { syncProducts, syncOrder } from "../utils/salesforce.js";

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);

  const products = await Product.find();
  const results = await syncProducts(products);
  const failed = results
    .map((r, i) => ({ r, name: products[i].name }))
    .filter(({ r }) => !r.success);
  console.log(`Products: ${products.length - failed.length} synced, ${failed.length} failed`);
  failed.forEach(({ r, name }) => console.log(`  ${name}: ${r.errors?.[0]?.message}`));

  const orders = await Order.find({ "items.0": { $exists: true } }).sort({ createdAt: 1 });
  let ok = 0;
  let bad = 0;
  for (const order of orders) {
    try {
      await syncOrder(order);
      ok++;
    } catch (err) {
      bad++;
      console.log(`  Order ${order._id}: ${err.message}`);
    }
  }
  console.log(`Orders: ${ok} synced, ${bad} failed`);
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});