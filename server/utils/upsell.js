// Explicit product-to-product upsell pairs — more precise than category-only matching
const upsellMap = {
  footwear: "Cotton Ankle Socks (Pack of 3)",
  electronics: "Phone Cover",
  outerwear: "Cotton Ankle Socks (Pack of 3)",
};

export async function getUpsellSuggestion(matchedProduct, Product) {
  const targetName = upsellMap[matchedProduct.category];
  if (!targetName) return null;

  const suggestion = await Product.findOne({
    name: targetName,
    _id: { $ne: matchedProduct._id },
  });

  return suggestion || null;
}