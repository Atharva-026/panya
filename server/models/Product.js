import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  stock: { type: Number, default: 20 },
  description: { type: String, default: "" },
  style: { type: String, default: "" },       // e.g. casual, formal, sport
  color: { type: String, default: "" },
  material: { type: String, default: "" },
  imageUrl: { type: String, default: "" },
});

export default mongoose.model("Product", productSchema);