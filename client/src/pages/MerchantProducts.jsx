import { useState, useEffect } from "react";
import { fetchProducts, createProduct, updateProduct, deleteProduct } from "../api/client";
import "./MerchantProducts.css";

const EMPTY_FORM = {
  name: "",
  price: "",
  category: "",
  stock: "",
  description: "",
  style: "",
  color: "",
  material: "",
  imageUrl: "",
};

function MerchantProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  function loadProducts() {
    setLoading(true);
    fetchProducts().then((data) => {
      setProducts(data);
      setLoading(false);
    });
  }

  useEffect(() => {
    loadProducts();
  }, []);

  function openAddModal() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  }

  function openEditModal(product) {
    setEditingId(product._id);
    setForm({
      name: product.name || "",
      price: product.price ?? "",
      category: product.category || "",
      stock: product.stock ?? "",
      description: product.description || "",
      style: product.style || "",
      color: product.color || "",
      material: product.material || "",
      imageUrl: product.imageUrl || "",
    });
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name || !form.price || !form.category) return;

    setSaving(true);
    const payload = {
      ...form,
      price: Number(form.price),
      stock: form.stock === "" ? undefined : Number(form.stock),
    };

    try {
      if (editingId) {
        await updateProduct(editingId, payload);
      } else {
        await createProduct(payload);
      }
      closeModal();
      loadProducts();
    } catch (err) {
      alert("Something went wrong saving this product. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this product? This can't be undone.")) return;
    await deleteProduct(id);
    loadProducts();
  }

  return (
    <div className="products-page">
      <div className="products-page-inner">
        <a href="/" className="nav-brand merchant-brand">पण्य</a>
        <div className="products-header">
          <div>
            <a href="/merchant" className="back-to-merchant-link">← Merchant Dashboard</a>
            <div className="dashboard-header">Manage Products</div>
          </div>
          <button className="add-product-btn" onClick={openAddModal}>+ Add Product</button>
        </div>

        {loading ? (
        <div className="products-loading">Loading products...</div>
      ) : (
        <div className="products-table-wrap">
          <table className="products-table">
            <thead>
              <tr>
                <th></th>
                <th>Name</th>
                <th>Price</th>
                <th>Category</th>
                <th>Stock</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p._id}>
                  <td className="product-thumb-cell">
                    {p.imageUrl ? (
                      <img
                        src={p.imageUrl}
                        alt={p.name}
                        className="product-thumb-sm"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src =
                            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Crect width='60' height='60' fill='%23e8e4dc'/%3E%3C/svg%3E";
                        }}
                      />
                    ) : (
                      <div className="product-thumb-sm placeholder" />
                    )}
                  </td>
                  <td>{p.name}</td>
                  <td>₹{p.price}</td>
                  <td>{p.category}</td>
                  <td>{p.stock}</td>
                  <td className="row-actions">
                    <button className="row-action-btn" onClick={() => openEditModal(p)}>Edit</button>
                    <button className="row-action-btn danger" onClick={() => handleDelete(p._id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {products.length === 0 && (
            <div className="products-empty">No products yet — add your first one above.</div>
          )}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">{editingId ? "Edit Product" : "Add Product"}</div>
            <form onSubmit={handleSubmit} className="product-form">
              <div className="form-row">
                <label>Name</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-row-split">
                <div className="form-row">
                  <label>Price (₹)</label>
                  <input type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
                </div>
                <div className="form-row">
                  <label>Stock</label>
                  <input type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} placeholder="20" />
                </div>
              </div>
              <div className="form-row">
                <label>Category</label>
                <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required />
              </div>
              <div className="form-row-split">
                <div className="form-row">
                  <label>Style</label>
                  <input value={form.style} onChange={(e) => setForm({ ...form, style: e.target.value })} placeholder="casual, formal, sport..." />
                </div>
                <div className="form-row">
                  <label>Color</label>
                  <input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
                </div>
              </div>
              <div className="form-row">
                <label>Material</label>
                <input value={form.material} onChange={(e) => setForm({ ...form, material: e.target.value })} />
              </div>
              <div className="form-row">
                <label>Image URL</label>
                <input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://..." />
              </div>
              <div className="form-row">
                <label>Description</label>
                <textarea rows="3" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="modal-actions">
                <button type="button" className="modal-cancel-btn" onClick={closeModal}>Cancel</button>
                <button type="submit" className="modal-save-btn" disabled={saving}>
                  {saving ? "Saving..." : editingId ? "Save Changes" : "Add Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

export default MerchantProducts;