import { saveProductAction } from "@/lib/actions";
import type { Category, Product } from "@/types";

export default function ProductForm({ product, categories }: { product?: Product; categories: Category[] }) {
  return (
    <form action={saveProductAction} style={{ background: "var(--surface)", border: "1px solid var(--sand)", padding: "1.5rem", display: "grid", gap: "1rem", maxWidth: 820 }}>
      {product && <input type="hidden" name="id" value={product.id} />}
      <label>
        <span className="admin-label">Name</span>
        <input name="name" required defaultValue={product?.name} className="admin-input" />
      </label>
      <label>
        <span className="admin-label">Slug</span>
        <input name="slug" defaultValue={product?.slug} className="admin-input" />
      </label>
      <label>
        <span className="admin-label">Description</span>
        <textarea name="description" rows={4} defaultValue={product?.description} className="admin-textarea" />
      </label>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label>
          <span className="admin-label">Category</span>
          <select name="category" defaultValue={product?.category} className="admin-select">
            {categories.map((cat) => (
              <option key={cat.id} value={cat.name}>{cat.name}</option>
            ))}
          </select>
        </label>
        <label>
          <span className="admin-label">Category slug</span>
          <select name="categorySlug" defaultValue={product?.categorySlug} className="admin-select">
            {categories.map((cat) => (
              <option key={cat.id} value={cat.slug}>{cat.slug}</option>
            ))}
          </select>
        </label>
        <label>
          <span className="admin-label">Price (QAR)</span>
          <input name="price" type="number" step="1" required defaultValue={product?.price} className="admin-input" />
        </label>
        <label>
          <span className="admin-label">Compare-at price</span>
          <input name="compareAtPrice" type="number" step="1" defaultValue={product?.compareAtPrice ?? ""} className="admin-input" />
        </label>
        <label>
          <span className="admin-label">SKU</span>
          <input name="sku" required defaultValue={product?.sku} className="admin-input" />
        </label>
        <label>
          <span className="admin-label">Stock</span>
          <input name="stock" type="number" required defaultValue={product?.stock ?? 0} className="admin-input" />
        </label>
        <label>
          <span className="admin-label">Badge</span>
          <select name="badge" defaultValue={product?.badge ?? ""} className="admin-select">
            <option value="">None</option>
            <option value="NEW">NEW</option>
            <option value="SALE">SALE</option>
            <option value="BESTSELLER">BESTSELLER</option>
            <option value="TRENDING">TRENDING</option>
          </select>
        </label>
        <label>
          <span className="admin-label">Status</span>
          <select name="status" defaultValue={product?.status ?? "active"} className="admin-select">
            <option value="active">Active</option>
            <option value="draft">Draft</option>
          </select>
        </label>
      </div>
      <label>
        <span className="admin-label">Image URLs (comma separated)</span>
        <textarea name="images" rows={2} defaultValue={product?.images.join(", ")} className="admin-textarea" />
      </label>
      <label>
        <span className="admin-label">Sizes (comma separated)</span>
        <input name="sizes" defaultValue={product?.sizes.join(", ") ?? "S, M, L, XL"} className="admin-input" />
      </label>
      <label>
        <span className="admin-label">Colors (comma separated)</span>
        <input name="colors" defaultValue={product?.colors.join(", ") ?? "Black"} className="admin-input" />
      </label>
      <button className="btn-gold">{product ? "Save product" : "Create product"}</button>
    </form>
  );
}
