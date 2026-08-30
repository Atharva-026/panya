import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "../models/Product.js";
dotenv.config();

const newProducts = [
  // Footwear
  { name: "Black Leather Loafers", price: 2899, category: "footwear", stock: 14, description: "Slip-on leather loafers, smart-casual, comfortable for all-day wear.", style: "casual", color: "black", material: "leather", imageUrl: "https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=400" },
  { name: "Brown Suede Boots", price: 4199, category: "footwear", stock: 8, description: "Ankle-height suede boots, rugged sole, suited for winter and outdoor wear.", style: "casual", color: "brown", material: "suede", imageUrl: "https://images.unsplash.com/photo-1520639888713-7851133b1ed0?w=400" },
  { name: "Grey Trail Running Shoe", price: 3199, category: "footwear", stock: 16, description: "Trail-ready running shoe with reinforced grip sole for uneven terrain.", style: "sport", color: "grey", material: "mesh", imageUrl: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=400" },
  { name: "Flip Flops", price: 349, category: "footwear", stock: 40, description: "Lightweight rubber flip flops for casual everyday wear.", style: "casual", color: "blue", material: "rubber", imageUrl: "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=400" },

  // Topwear
  { name: "Striped Polo Shirt", price: 899, category: "topwear", stock: 25, description: "Cotton pique polo shirt with classic stripe pattern, smart-casual wear.", style: "casual", color: "navy", material: "cotton pique", imageUrl: "https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?w=400" },
  { name: "Checked Flannel Shirt", price: 1099, category: "topwear", stock: 18, description: "Soft flannel checked shirt, warm and casual, great for layering.", style: "casual", color: "red", material: "flannel", imageUrl: "https://images.unsplash.com/photo-1602810318660-d2c46b750f88?w=400" },
  { name: "Formal Sky Blue Shirt", price: 1399, category: "topwear", stock: 20, description: "Slim-fit sky blue formal shirt, suited for office and business meetings.", style: "formal", color: "sky blue", material: "cotton blend", imageUrl: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400" },
  { name: "Graphic Print T-Shirt", price: 599, category: "topwear", stock: 30, description: "Casual cotton t-shirt with graphic print, everyday streetwear style.", style: "casual", color: "black", material: "cotton", imageUrl: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400" },

  // Outerwear
  { name: "Navy Bomber Jacket", price: 3899, category: "outerwear", stock: 12, description: "Classic bomber jacket with ribbed cuffs, casual streetwear layering piece.", style: "casual", color: "navy", material: "polyester", imageUrl: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400" },
  { name: "Beige Trench Coat", price: 5499, category: "outerwear", stock: 7, description: "Classic knee-length trench coat, smart-formal outerwear for cooler weather.", style: "formal", color: "beige", material: "cotton blend", imageUrl: "https://images.unsplash.com/photo-1520975954732-35dd22299614?w=400" },
  { name: "Puffer Vest", price: 2299, category: "outerwear", stock: 15, description: "Lightweight quilted puffer vest, casual layering for chilly days.", style: "casual", color: "black", material: "polyester fill", imageUrl: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400" },

  // Electronics
  { name: "Smartwatch", price: 4499, category: "electronics", stock: 10, description: "Fitness-tracking smartwatch with heart rate monitor and notifications.", style: "everyday", color: "black", material: "plastic", imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400" },
  { name: "Bluetooth Speaker", price: 1799, category: "electronics", stock: 18, description: "Portable Bluetooth speaker with 12-hour battery, water-resistant design.", style: "everyday", color: "grey", material: "plastic", imageUrl: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400" },
  { name: "Power Bank 10000mAh", price: 999, category: "electronics", stock: 25, description: "Compact 10000mAh power bank, dual USB output, fast charging support.", style: "everyday", color: "black", material: "plastic", imageUrl: "https://images.unsplash.com/photo-1609592806596-4d1b5e5e6b8a?w=400" },
  { name: "USB-C Cable (1m)", price: 249, category: "electronics", stock: 60, description: "Durable braided USB-C charging cable, 1 meter length.", style: "everyday", color: "black", material: "braided nylon", imageUrl: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=400" },

  // Accessories
  { name: "Aviator Sunglasses", price: 1299, category: "accessories", stock: 22, description: "Classic aviator sunglasses with UV protection, unisex style.", style: "everyday", color: "gold", material: "metal frame", imageUrl: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400" },
  { name: "Canvas Tote Bag", price: 549, category: "accessories", stock: 30, description: "Sturdy canvas tote bag, everyday carry, casual style.", style: "casual", color: "beige", material: "canvas", imageUrl: "https://images.unsplash.com/photo-1591561954557-26941169b49e?w=400" },
  { name: "Analog Wrist Watch", price: 2199, category: "accessories", stock: 14, description: "Minimalist analog wrist watch with leather strap, formal styling.", style: "formal", color: "brown", material: "leather strap", imageUrl: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=400" },
  { name: "Woolen Beanie", price: 399, category: "accessories", stock: 35, description: "Warm woolen beanie cap for winter, casual everyday wear.", style: "casual", color: "grey", material: "wool", imageUrl: "https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=400" },

  // Grocery — ideal for recurring auto-order use case
  { name: "Basmati Rice (5kg)", price: 649, category: "grocery", stock: 40, description: "Premium long-grain basmati rice, 5kg pack, household staple.", style: "daily essential", color: "", material: "", imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400" },
  { name: "Wheat Atta (5kg)", price: 289, category: "grocery", stock: 45, description: "Whole wheat flour, 5kg pack, for daily rotis and baking.", style: "daily essential", color: "", material: "", imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400" },
  { name: "Sunflower Cooking Oil (1L)", price: 179, category: "grocery", stock: 50, description: "Refined sunflower cooking oil, 1 litre bottle.", style: "daily essential", color: "", material: "", imageUrl: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400" },
  { name: "Toor Dal (1kg)", price: 159, category: "grocery", stock: 55, description: "Split pigeon peas (toor dal), 1kg pack, everyday cooking staple.", style: "daily essential", color: "", material: "", imageUrl: "https://images.unsplash.com/photo-1585996301518-2f5e73e4a2d5?w=400" },
  { name: "Sugar (1kg)", price: 49, category: "grocery", stock: 60, description: "Refined white sugar, 1kg pack.", style: "daily essential", color: "", material: "", imageUrl: "https://images.unsplash.com/photo-1581441363689-1f3c3c414635?w=400" },
  { name: "Assam Tea (250g)", price: 129, category: "grocery", stock: 40, description: "Strong Assam black tea leaves, 250g pack.", style: "daily essential", color: "", material: "", imageUrl: "https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=400" },
  { name: "Full Cream Milk Powder (500g)", price: 289, category: "grocery", stock: 30, description: "Full cream milk powder, 500g pack, long shelf life.", style: "daily essential", color: "", material: "", imageUrl: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400" },
  { name: "Iodised Salt (1kg)", price: 25, category: "grocery", stock: 70, description: "Iodised table salt, 1kg pack.", style: "daily essential", color: "", material: "", imageUrl: "https://images.unsplash.com/photo-1518110925495-5fe2fda0442c?w=400" },
  { name: "Mixed Fruit Jam (500g)", price: 199, category: "grocery", stock: 25, description: "Mixed fruit jam, 500g jar, breakfast essential.", style: "daily essential", color: "", material: "", imageUrl: "https://images.unsplash.com/photo-1590779033100-9f60a05a013d?w=400" },
  { name: "Instant Noodles (Pack of 6)", price: 84, category: "grocery", stock: 80, description: "Quick-cook instant noodles, pack of 6, masala flavor.", style: "daily essential", color: "", material: "", imageUrl: "https://images.unsplash.com/photo-1612927601601-6638404737ce?w=400" },
  { name: "Assorted Biscuits (Pack of 4)", price: 149, category: "grocery", stock: 45, description: "Assorted tea-time biscuits, pack of 4.", style: "daily essential", color: "", material: "", imageUrl: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=400" },
  { name: "Filtered Drinking Water (20L Can)", price: 90, category: "grocery", stock: 30, description: "20-litre filtered drinking water can, refillable.", style: "daily essential", color: "", material: "", imageUrl: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400" },
];

async function addProducts() {
  await mongoose.connect(process.env.MONGODB_URI);
  const result = await Product.insertMany(newProducts);
  console.log(`Added ${result.length} new products (existing catalog untouched).`);
  process.exit();
}

addProducts();