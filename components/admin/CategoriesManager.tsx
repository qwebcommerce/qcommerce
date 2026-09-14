"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import AdminModal from "@/components/admin/AdminModal";
import ImageUpload from "@/components/admin/ImageUpload";
import { deleteCategoryAction, saveCategoryAction } from "@/lib/actions";
import { filterCategoryTree, nestCategories } from "@/lib/categories";
import { slugify } from "@/lib/format";
import { usePreferences } from "@/lib/preferences";
import { useToast } from "@/lib/toast";
import type { Category } from "@/types";

const PAGE_SIZE = 8;

type Editor = {
  id?: string;
  parentId: string | null;
  name: string;
  nameAr: string;
  slug: string;
  subtitle: string;
  subtitleAr: string;
  image: string;
  file: File | null;
  removeImage: boolean;
  sortOrder: number;
  slugTouched: boolean;
};

type Deleting = {
  id: string;
  name: string;
  isSubcategory: boolean;
};

export default function CategoriesManager({
  categories,
  productCounts,
}: {
  categories: Category[];
  productCounts: Record<string, number>;
}) {
  const { t } = usePreferences();
  const toast = useToast();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [deleting, setDeleting] = useState<Deleting | null>(null);
  const [error, setError] = useState("");
  const tree = useMemo(() => nestCategories(categories), [categories]);
  const filtered = useMemo(() => filterCategoryTree(tree, query), [tree, query]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const from = filtered.length ? (currentPage - 1) * PAGE_SIZE + 1 : 0;
  const to = Math.min(currentPage * PAGE_SIZE, filtered.length);

  useEffect(() => {
    setPage(1);
  }, [query]);

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  function openCreate(parentId: string | null) {
    const siblings = parentId
      ? categories.filter((category) => category.parentId === parentId)
      : categories.filter((category) => !category.parentId);
    setError("");
    setEditor({
      parentId,
      name: "",
      nameAr: "",
      slug: "",
      subtitle: "",
      subtitleAr: "",
      image: "",
      file: null,
      removeImage: false,
      sortOrder: siblings.length + 1,
      slugTouched: false,
    });
  }

  function openEdit(category: Category) {
    setError("");
    setEditor({
      id: category.id,
      parentId: category.parentId,
      name: category.name,
      nameAr: category.nameAr,
      slug: category.slug,
      subtitle: category.subtitle,
      subtitleAr: category.subtitleAr,
      image: category.image,
      file: null,
      removeImage: false,
      sortOrder: category.sortOrder,
      slugTouched: true,
    });
  }

  function setName(name: string) {
    setEditor((current) => {
      if (!current) return current;
      return {
        ...current,
        name,
        slug: current.slugTouched ? current.slug : slugify(name),
      };
    });
  }

  function save() {
    if (!editor) return;
    const form = new FormData();
    if (editor.id) form.set("id", editor.id);
    if (editor.parentId) form.set("parentId", editor.parentId);
    form.set("name", editor.name);
    form.set("nameAr", editor.nameAr);
    form.set("slug", editor.slug);
    form.set("subtitle", editor.subtitle);
    form.set("subtitleAr", editor.subtitleAr);
    if (editor.file) form.set("imageFile", editor.file);
    if (editor.removeImage) form.set("removeImage", "1");
    form.set("sortOrder", String(editor.sortOrder));
    startTransition(async () => {
      const result = await saveCategoryAction(form);
      if (result.error) {
        setError(result.error);
        toast.error(t("toastError"), result.error);
        return;
      }
      toast.success(editor.id ? t("toastCategoryUpdated") : t("toastCategoryCreated"));
      setEditor(null);
      router.refresh();
    });
  }

  function confirmDelete() {
    if (!deleting) return;
    const form = new FormData();
    form.set("id", deleting.id);
    startTransition(async () => {
      const result = await deleteCategoryAction(form);
      if (result.error) {
        setError(result.error);
        toast.error(t("toastError"), result.error);
        return;
      }
      toast.success(t("toastCategoryDeleted"));
      setDeleting(null);
      setError("");
      router.refresh();
    });
  }

  const editingSubcategory = Boolean(editor?.parentId);
  const modalTitle = editor?.id
    ? editingSubcategory
      ? t("editSubcategory")
      : t("editCategory")
    : editingSubcategory
      ? t("addSubcategory")
      : t("addCategory");

  return (
    <div>
      <div className="admin-page-head">
        <div>
          <p className="admin-kicker">{t("admin")}</p>
          <h1 className="admin-title">{t("categoriesNav")}</h1>
        </div>
        <div className="admin-page-head__actions">
          <button type="button" className="btn-gold btn-compact" onClick={() => openCreate(null)}>
            {t("addCategory")}
          </button>
        </div>
      </div>
      <p className="admin-lead">{t("categoriesIntro")}</p>
      {tree.length > 0 ? (
        <div className="admin-toolbar">
          <label className="admin-search">
            <SearchIcon />
            <span className="sr-only">{t("categorySearch")}</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("categorySearch")}
            />
          </label>
        </div>
      ) : null}

      {tree.length === 0 ? (
        <section className="admin-panel">
          <p className="admin-empty">{t("noCategories")}</p>
        </section>
      ) : filtered.length === 0 ? (
        <section className="admin-panel">
          <p className="admin-empty">{t("noSearchResults")}</p>
        </section>
      ) : (
        <>
          <div className="admin-cat-list">
            {visible.map((category) => {
              const ownCount = productCounts[category.slug] ?? 0;
              const childCount = category.children.reduce((sum, child) => sum + (productCounts[child.slug] ?? 0), 0);
              return (
                <section key={category.id} className="admin-panel admin-cat-card">
                  <div className="admin-cat-card__head">
                    <div className="admin-cat-card__identity">
                      <div className="admin-cat-thumb">
                        {category.image ? <img src={category.image} alt="" /> : <span />}
                      </div>
                      <div>
                        <strong>{category.name}</strong>
                        {category.nameAr ? <b dir="rtl">{category.nameAr}</b> : null}
                        <span>/{category.slug}</span>
                        {category.subtitle ? <span>{category.subtitle}</span> : null}
                        {category.subtitleAr ? <span dir="rtl">{category.subtitleAr}</span> : null}
                        <em>
                          {t("productsCount", { count: ownCount + childCount })}
                          {category.children.length
                            ? ` · ${t("subcategoryCount", { count: category.children.length })}`
                            : ` · ${t("noSubcategories")}`}
                        </em>
                      </div>
                    </div>
                    <div className="admin-cat-actions">
                      <button type="button" className="admin-text-btn admin-text-btn--gold" onClick={() => openCreate(category.id)}>
                        {t("addSubcategory")}
                      </button>
                      <button type="button" className="admin-text-btn" onClick={() => openEdit(category)}>
                        {t("edit")}
                      </button>
                      <button
                        type="button"
                        className="admin-text-btn admin-text-btn--danger"
                        onClick={() => {
                          setError("");
                          setDeleting({ id: category.id, name: category.name, isSubcategory: false });
                        }}
                      >
                        {t("delete")}
                      </button>
                    </div>
                  </div>

                  {category.children.length > 0 ? (
                    <ul className="admin-subcat-list">
                      {category.children.map((child) => (
                        <li key={child.id}>
                          <div className="admin-cat-card__identity">
                            <div className="admin-cat-thumb admin-cat-thumb--sm">
                              {child.image ? <img src={child.image} alt="" /> : <span />}
                            </div>
                            <div>
                              <strong>{child.name}</strong>
                              {child.nameAr ? <b dir="rtl">{child.nameAr}</b> : null}
                              <span>/{child.slug}</span>
                              {child.subtitle ? <span>{child.subtitle}</span> : null}
                              {child.subtitleAr ? <span dir="rtl">{child.subtitleAr}</span> : null}
                              <span>{t("productsCount", { count: productCounts[child.slug] ?? 0 })}</span>
                            </div>
                          </div>
                          <div className="admin-cat-actions">
                            <button type="button" className="admin-text-btn" onClick={() => openEdit(child)}>
                              {t("edit")}
                            </button>
                            <button
                              type="button"
                              className="admin-text-btn admin-text-btn--danger"
                              onClick={() => {
                                setError("");
                                setDeleting({ id: child.id, name: child.name, isSubcategory: true });
                              }}
                            >
                              {t("delete")}
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </section>
              );
            })}
          </div>
          <div className="admin-pager">
            <p>{t("showingCount", { from, to, total: filtered.length })}</p>
            <div className="admin-pager__btns">
              <button type="button" className="admin-text-btn" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>
                {t("previous")}
              </button>
              <span>{t("pageOf", { page: currentPage, pages: pageCount })}</span>
              <button type="button" className="admin-text-btn" disabled={currentPage >= pageCount} onClick={() => setPage(currentPage + 1)}>
                {t("next")}
              </button>
            </div>
          </div>
        </>
      )}

      {editor ? (
        <AdminModal
          title={modalTitle}
          onClose={() => (pending ? undefined : setEditor(null))}
          footer={
            <>
              <button type="button" className="admin-text-btn" onClick={() => setEditor(null)} disabled={pending}>
                {t("cancel")}
              </button>
              <button type="button" className="btn-gold btn-compact" onClick={save} disabled={pending || !editor.name.trim()}>
                {pending ? t("saving") : t("saveCategory")}
              </button>
            </>
          }
        >
          {error ? <p className="admin-form-error">{error}</p> : null}
          {editor.parentId && !editor.id ? (
            <p className="admin-modal-note">
              {t("parentCategory")}: {tree.find((item) => item.id === editor.parentId)?.name}
            </p>
          ) : null}
          <div className="admin-lang-grid">
            <label>
              <span className="admin-label">{t("nameEnglish")}</span>
              <input className="admin-input" value={editor.name} onChange={(event) => setName(event.target.value)} autoFocus />
            </label>
            <label>
              <span className="admin-label">{t("nameArabic")}</span>
              <input
                className="admin-input"
                dir="rtl"
                lang="ar"
                value={editor.nameAr}
                onChange={(event) => setEditor({ ...editor, nameAr: event.target.value })}
              />
            </label>
            <label>
              <span className="admin-label">{t("subtitleEnglish")}</span>
              <input
                className="admin-input"
                value={editor.subtitle}
                onChange={(event) => setEditor({ ...editor, subtitle: event.target.value })}
              />
            </label>
            <label>
              <span className="admin-label">{t("subtitleArabic")}</span>
              <input
                className="admin-input"
                dir="rtl"
                lang="ar"
                value={editor.subtitleAr}
                onChange={(event) => setEditor({ ...editor, subtitleAr: event.target.value })}
              />
            </label>
          </div>
          <label>
            <span className="admin-label">{t("categorySlug")}</span>
            <input
              className="admin-input"
              value={editor.slug}
              onChange={(event) => setEditor({ ...editor, slug: event.target.value, slugTouched: true })}
            />
            <small className="admin-field-hint">{t("slugHint")}</small>
          </label>
          <ImageUpload
            value={editor.removeImage ? "" : editor.image}
            file={editor.file}
            disabled={pending}
            onFile={(file) => setEditor({ ...editor, file, removeImage: false })}
            onRemove={() => setEditor({ ...editor, file: null, image: "", removeImage: true })}
          />
          {editor.id && categories.some((category) => category.parentId === editor.id) ? null : editor.id ? (
            <label>
              <span className="admin-label">{t("parentCategory")}</span>
              <select
                className="admin-select"
                value={editor.parentId ?? ""}
                onChange={(event) => setEditor({ ...editor, parentId: event.target.value || null })}
              >
                <option value="">{t("makeTopLevel")}</option>
                {tree
                  .filter((parent) => parent.id !== editor.id)
                  .map((parent) => (
                    <option key={parent.id} value={parent.id}>
                      {parent.name}
                    </option>
                  ))}
              </select>
            </label>
          ) : null}
          <label>
            <span className="admin-label">{t("sortOrder")}</span>
            <input
              className="admin-input"
              type="number"
              value={editor.sortOrder}
              onChange={(event) => setEditor({ ...editor, sortOrder: Number(event.target.value || 0) })}
            />
          </label>
        </AdminModal>
      ) : null}

      {deleting ? (
        <AdminModal
          title={deleting.isSubcategory ? t("deleteSubcategory") : t("deleteCategory")}
          onClose={() => (pending ? undefined : setDeleting(null))}
          footer={
            <>
              <button type="button" className="admin-text-btn" onClick={() => setDeleting(null)} disabled={pending}>
                {t("cancel")}
              </button>
              <button type="button" className="btn-gold btn-compact btn-danger" onClick={confirmDelete} disabled={pending}>
                {pending ? t("saving") : t("delete")}
              </button>
            </>
          }
        >
          {error ? <p className="admin-form-error">{error}</p> : null}
          <p className="admin-modal-note">
            {deleting.isSubcategory
              ? t("confirmDeleteSubcategory", { name: deleting.name })
              : t("confirmDeleteCategory", { name: deleting.name })}
          </p>
        </AdminModal>
      ) : null}
    </div>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="6.25" stroke="currentColor" strokeWidth="1.7" />
      <path d="M16 16.5 20 20.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}
