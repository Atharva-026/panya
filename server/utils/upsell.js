// Simple rule-based upsell map — deliberately not another LLM call, to keep latency low
const upsellRules = {
  footwear: "accessories",   // shoes -> suggest socks
  outerwear: "accessories",  // jacket -> suggest accessories
  electronics: "accessories", // earbuds -> suggest phone cover etc.
};

export async function getUpsellSuggestion(matchedProduct, Product) {
  const targetCategory = upsellRules[matchedProduct.category];
  if (!targetCategory) return null;

  const suggestion = await Product.findOne({
    category: targetCategory,
    _id: { $ne: matchedProduct._id },
  });

  return suggestion || null;
}