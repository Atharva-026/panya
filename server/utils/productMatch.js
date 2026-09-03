// Deterministic, non-LLM scoring used to (a) shortlist which products get
// sent to the model on each chat message, and (b) detect near-ties so the
// system prompt can tell the model "these are tied, ask the customer"
// instead of leaving that judgment call entirely to the model.

const STOPWORDS = new Set([
  "a", "an", "the", "i", "want", "need", "looking", "for", "some", "any",
  "please", "me", "my", "is", "are", "to", "of", "in", "with", "and", "or",
  "under", "below", "around", "about", "near", "have", "got", "show", "find",
]);

function tokenize(text) {
  return (text || "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

// Pulls a target price out of free text like "under 1000", "₹500", "around 800 rupees".
function extractBudget(message) {
  const match = (message || "").match(/(?:₹|rs\.?|inr)?\s*([0-9]{2,6})/i);
  return match ? Number(match[1]) : null;
}

// Score is 0-100, purely for internal ranking — never shown to the customer.
function scoreProduct(product, queryTokens, budget) {
  const fieldText = [
    product.name,
    product.category,
    product.style,
    product.color,
    product.material,
    product.description,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const nameCategoryText = `${product.name} ${product.category}`.toLowerCase();

  let score = 0;

  for (const token of queryTokens) {
    if (nameCategoryText.includes(token)) score += 12; // name/category hit = strong signal
    else if (fieldText.includes(token)) score += 6; // style/color/material/description hit
  }

  if (budget && product.price) {
    const diff = Math.abs(product.price - budget) / budget;
    if (diff <= 1) score += (1 - diff) * 15; // closer price = up to 15 bonus points
  }

  return Math.round(score);
}

// Returns { candidates, tieNote } — candidates is the shortlist to send to
// the LLM (already sorted best-first), tieNote is a plain-English hint to
// splice into the system prompt when the top matches are too close to call,
// or "" when there's a clear leader (or no real match at all).
function rankProducts(products, message, { maxCandidates = 10, tieMargin = 0.1 } = {}) {
  const queryTokens = tokenize(message);
  const budget = extractBudget(message);

  const scored = products
    .map((product) => ({ product, score: scoreProduct(product, queryTokens, budget) }))
    .sort((a, b) => b.score - a.score);

  const candidates = scored.slice(0, maxCandidates).map((s) => s.product);

  let tieNote = "";
  const [top, second] = scored;
  if (top && second && top.score > 0 && second.score >= top.score * (1 - tieMargin)) {
    const tied = scored
      .filter((s) => s.score >= top.score * (1 - tieMargin) && s.score > 0)
      .slice(0, 4)
      .map((s) => s.product.name);

    if (tied.length >= 2) {
      tieNote = `SYSTEM NOTE (not from the customer): these candidates are near-identical matches for this query — ${tied.join(
        ", "
      )}. Per instruction 4 below, you MUST set matchedProductId to null and ask the customer which one they'd prefer, unless one is obviously the better fit despite the score being close.`;
    }
  }

  return { candidates, tieNote };
}

export { rankProducts };