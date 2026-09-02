import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PromoCarousel from "../components/PromoCarousel";
import "./Storefront.css";

const CATEGORY_LABELS = {
  footwear: "Footwear",
  topwear: "Clothing",
  outerwear: "Outerwear",
  electronics: "Electronics",
  accessories: "Accessories",
};

async function fetchProducts() {
  const res = await fetch("/api/order/products");
  return res.json();
}

function Storefront() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts().then((data) => {
      setProducts(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="storefront-page">Loading catalog...</div>;

  const categories = [...new Set(products.map((p) => p.category))];

  function goToProduct(product) {
    navigate("/chat", { state: { initialPrompt: `Show me the ${product.name}` } });
  }

  if (selectedCategory) {
    const label = CATEGORY_LABELS[selectedCategory] || selectedCategory;
    const items = products.filter((p) => p.category === selectedCategory);

    return (
      <div className="storefront-page">
        <button className="back-btn" onClick={() => setSelectedCategory(null)}>
          ← Back to categories
        </button>

        <div className="storefront-header">
          <h1>{label}</h1>
          <p>{items.length} item{items.length === 1 ? "" : "s"} in this category.</p>
        </div>

        <div className="product-grid">
          {items.map((p) => (
            <div key={p._id} className="product-card" onClick={() => goToProduct(p)}>
              {p.imageUrl && <img src={p.imageUrl} alt={p.name} className="product-image" />}
              <div className="product-info">
                <div className="product-name">{p.name}</div>
                <div className="product-price">₹{p.price}</div>
                <div className="product-meta">{p.category} · {p.style}</div>
                <div className="product-stock">{p.stock} in stock</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const slides = categories
    .slice(0, 4)
    .map((cat) => {
      const sample = products.find((p) => p.category === cat && p.imageUrl);
      return { category: cat, label: CATEGORY_LABELS[cat] || cat, imageUrl: sample?.imageUrl };
    })
    .filter((s) => s.imageUrl);

  return (
    <div className="storefront-page">
      <div className="storefront-header">
        <h1>Panya Storefront</h1>
        <p>The live merchant catalog Panya's agent shops from.</p>
      </div>

      <PromoCarousel slides={slides} onSelect={setSelectedCategory} />

      <div className="category-grid">
        {categories.map((cat) => {
          const sample = products.find((p) => p.category === cat);
          return (
            <button key={cat} className="category-tile" onClick={() => setSelectedCategory(cat)}>
              {sample?.imageUrl && (
                <img src={sample.imageUrl} alt={cat} className="category-tile-image" />
              )}
              <div className="category-tile-label">{CATEGORY_LABELS[cat] || cat}</div>
              <div className="category-tile-count">
                {products.filter((p) => p.category === cat).length} items
              </div>
            </button>
          );
        })}
      </div>

      <div className="all-products-title">All Items</div>
      <div className="product-grid">
        {products.map((p) => (
          <div key={p._id} className="product-card" onClick={() => goToProduct(p)}>
            {p.imageUrl && <img src={p.imageUrl} alt={p.name} className="product-image" />}
            <div className="product-info">
              <div className="product-name">{p.name}</div>
              <div className="product-price">₹{p.price}</div>
              <div className="product-meta">{p.category} · {p.style}</div>
              <div className="product-stock">{p.stock} in stock</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Storefront;