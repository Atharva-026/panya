import { useState, useEffect } from "react";
import "./Storefront.css";

async function fetchProducts() {
  const res = await fetch("/api/order/products");
  return res.json();
}

function Storefront() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts().then((data) => {
      setProducts(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="storefront-page">Loading catalog...</div>;

  return (
    <div className="storefront-page">
      <div className="storefront-header">
        <h1>Panya Storefront</h1>
        <p>The live merchant catalog Panya's agent shops from.</p>
      </div>

      <div className="product-grid">
        {products.map((p) => (
          <div key={p._id} className="product-card">
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