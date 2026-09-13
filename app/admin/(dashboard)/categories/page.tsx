import { deleteCategoryAction, saveCategoryAction } from "@/lib/actions";
import { listCategories } from "@/lib/db";

export const metadata = { title: "Categories" };

export default async function AdminCategoriesPage() {
  const categories = await listCategories();

  return (
    <div>
      <h1 style={{ fontSize: "1.6rem", fontWeight: 900, marginBottom: "1.5rem" }}>CATEGORIES</h1>
      <form action={saveCategoryAction} style={{ background: "var(--surface)", border: "1px solid var(--sand)", padding: "1.25rem", display: "grid", gap: "0.75rem", marginBottom: "2rem", maxWidth: 640 }}>
        <h2 style={{ fontWeight: 800 }}>Add category</h2>
        <input name="name" required placeholder="Name" className="admin-input" />
        <input name="slug" placeholder="Slug" className="admin-input" />
        <input name="subtitle" placeholder="Subtitle" className="admin-input" />
        <input name="image" placeholder="Image URL" className="admin-input" />
        <input name="sortOrder" type="number" defaultValue={categories.length + 1} className="admin-input" />
        <button className="btn-gold">Save category</button>
      </form>
      <div style={{ display: "grid", gap: "0.75rem" }}>
        {categories.map((cat) => (
          <div key={cat.id} style={{ background: "var(--surface)", border: "1px solid var(--sand)", padding: "1rem", display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "center" }}>
            <div>
              <strong>{cat.name}</strong>
              <p style={{ color: "var(--muted)", fontSize: "0.8rem" }}>{cat.slug} · {cat.subtitle}</p>
            </div>
            <form action={deleteCategoryAction}>
              <input type="hidden" name="id" value={cat.id} />
              <button style={{ background: "none", border: "none", color: "var(--sale)", cursor: "pointer" }}>Delete</button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
