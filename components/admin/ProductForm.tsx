"use client";

import { useEffect, useMemo, useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ImageUpload from "@/components/admin/ImageUpload";
import ProductImagesUpload from "@/components/admin/ProductImagesUpload";
import { saveProductAction } from "@/lib/actions";
import { nestCategories } from "@/lib/categories";
import { slugify } from "@/lib/format";
import { csvList, productStock, syncProductVariants } from "@/lib/products";
import { usePreferences } from "@/lib/preferences";
import { useToast } from "@/lib/toast";
import type { Category, Product, ProductVariant } from "@/types";

function NumericInput({
  name,
  value,
  onValue,
  required,
  className = "admin-input",
}: {
  name?: string;
  value: number;
  onValue: (next: number) => void;
  required?: boolean;
  className?: string;
}) {
  return (
    <input
      name={name}
      className={className}
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      required={required}
      value={Number.isFinite(value) ? String(value) : ""}
      onFocus={(event) => event.currentTarget.select()}
      onChange={(event) => {
        const raw = event.target.value.trim();
        if (raw === "") {
          onValue(0);
          return;
        }
        if (/^\d+$/.test(raw)) onValue(Number(raw));
      }}
    />
  );
}

export default function ProductForm({ product, categories }: { product?: Product; categories: Category[] }) {
  const { t } = usePreferences();
  const toast = useToast();
  const router = useRouter();
  const tree = nestCategories(categories);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(product));
  const [price, setPrice] = useState(product?.price ?? 0);
  const [compareAtPrice, setCompareAtPrice] = useState(product?.compareAtPrice ?? 0);
  const [sku, setSku] = useState(product?.sku ?? "");
  const [stock, setStock] = useState(
    product?.hasVariants && product.variants[0] ? product.variants[0].stock : (product?.stock ?? 0),
  );
  const [sizes, setSizes] = useState(product?.sizes.join(", ") ?? "S, M, L, XL");
  const [colors, setColors] = useState(product?.colors.join(", ") ?? "Black");
  const [hasVariants, setHasVariants] = useState(product?.hasVariants ?? false);
  const [variants, setVariants] = useState<ProductVariant[]>(product?.variants ?? []);
  const [variantFiles, setVariantFiles] = useState<Record<string, File | null>>({});
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const selectedId =
    categories.find((category) => category.slug === product?.categorySlug)?.id ?? tree[0]?.id ?? "";
  const sizeList = csvList(sizes);
  const colorList = csvList(colors);
  const defaults = useMemo(
    () => ({
      price: Number(price) || 0,
      stock: Number(stock) || 0,
      sku,
      compareAtPrice: compareAtPrice ? Number(compareAtPrice) : null,
    }),
    [price, stock, sku, compareAtPrice],
  );

  useEffect(() => {
    if (!hasVariants) return;
    setVariants((current) => syncProductVariants(current, sizeList, colorList, defaults));
    // defaults applied only to newly created combos inside syncProductVariants
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasVariants, sizes, colors]);

  function onName(value: string) {
    setName(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  function patchVariant(id: string, patch: Partial<ProductVariant>) {
    setVariants((current) => current.map((variant) => (variant.id === id ? { ...variant, ...patch } : variant)));
  }

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!images.length && !imageFiles.length) {
      const message = t("productImageRequired");
      setError(message);
      toast.error(t("toastError"), message);
      return;
    }
    const formData = new FormData(event.currentTarget);
    formData.set("hasVariants", hasVariants ? "1" : "0");
    formData.set("variants", JSON.stringify(variants));
    formData.set("images", images.join(", "));
    imageFiles.forEach((file, index) => formData.set(`imageFile_${index}`, file));
    for (const [id, file] of Object.entries(variantFiles)) {
      if (file) formData.set(`variantFile_${id}`, file);
    }
    startTransition(async () => {
      const result = await saveProductAction(formData);
      if (result?.error) {
        setError(result.error);
        toast.error(t("toastError"), result.error);
        return;
      }
      toast.success(product ? t("toastProductUpdated") : t("toastProductCreated"));
      router.push("/admin/products");
      router.refresh();
    });
  }

  const totalStock = hasVariants ? productStock({ stock, hasVariants: true, variants }) : stock;

  return (
    <div className={`admin-form-page${hasVariants ? " admin-form-page--wide" : ""}`}>
      <Link href="/admin/products" className="admin-back">
        ← {t("backToProducts")}
      </Link>
      <div className="admin-page-head">
        <div>
          <p className="admin-kicker">{t("admin")}</p>
          <h1 className="admin-title">{product ? t("editProduct") : t("newProduct")}</h1>
        </div>
      </div>
      <form onSubmit={save} className="admin-form-card">
        {product ? <input type="hidden" name="id" value={product.id} /> : null}
        {error ? <p className="admin-form-error">{error}</p> : null}
        <div className="admin-lang-grid">
          <label>
            <span className="admin-label">{t("nameEnglish")}</span>
            <input name="name" required className="admin-input" value={name} onChange={(event) => onName(event.target.value)} />
          </label>
          <label>
            <span className="admin-label">{t("nameArabic")}</span>
            <input
              name="nameAr"
              className="admin-input"
              dir="rtl"
              lang="ar"
              defaultValue={product?.nameAr}
            />
          </label>
        </div>
        <div className="admin-lang-grid">
          <label>
            <span className="admin-label">{t("descriptionEnglish")}</span>
            <textarea name="description" rows={5} className="admin-textarea" defaultValue={product?.description} />
          </label>
          <label>
            <span className="admin-label">{t("descriptionArabic")}</span>
            <textarea
              name="descriptionAr"
              rows={5}
              className="admin-textarea"
              dir="rtl"
              lang="ar"
              defaultValue={product?.descriptionAr}
            />
          </label>
        </div>
        <label>
          <span className="admin-label">{t("categorySlug")}</span>
          <input
            name="slug"
            className="admin-input"
            value={slug}
            onChange={(event) => {
              setSlug(event.target.value);
              setSlugTouched(true);
            }}
          />
          <small className="admin-field-hint">{t("slugHint")}</small>
        </label>
        <fieldset className="admin-type-toggle">
          <legend className="admin-label">{t("productType")}</legend>
          <div className="admin-type-toggle__row">
            <button
              type="button"
              className={`admin-type-toggle__btn${!hasVariants ? " is-on" : ""}`}
              onClick={() => setHasVariants(false)}
            >
              {t("simpleProduct")}
            </button>
            <button
              type="button"
              className={`admin-type-toggle__btn${hasVariants ? " is-on" : ""}`}
              onClick={() => setHasVariants(true)}
            >
              {t("variantProduct")}
            </button>
          </div>
          <small className="admin-field-hint">{hasVariants ? t("variantHint") : t("simpleHint")}</small>
        </fieldset>
        <div className="admin-form-grid">
          <label>
            <span className="admin-label">{t("productCategory")}</span>
            <select name="categoryId" defaultValue={selectedId} className="admin-select" required>
              {tree.map((parent) =>
                parent.children.length ? (
                  <optgroup key={parent.id} label={parent.name}>
                    <option value={parent.id}>{parent.name}</option>
                    {parent.children.map((child) => (
                      <option key={child.id} value={child.id}>
                        {parent.name} / {child.name}
                      </option>
                    ))}
                  </optgroup>
                ) : (
                  <option key={parent.id} value={parent.id}>
                    {parent.name}
                  </option>
                ),
              )}
            </select>
          </label>
          <label>
            <span className="admin-label">{t("priceLabel")}</span>
            <NumericInput name="price" required value={price} onValue={setPrice} />
          </label>
          <label>
            <span className="admin-label">{t("compareAtPrice")}</span>
            <NumericInput
              name="compareAtPrice"
              value={compareAtPrice || 0}
              onValue={setCompareAtPrice}
            />
          </label>
          <label>
            <span className="admin-label">{t("sku")}</span>
            <input name="sku" required className="admin-input" value={sku} onChange={(event) => setSku(event.target.value)} />
          </label>
          <label>
            <span className="admin-label">{hasVariants ? t("defaultStock") : t("stockLabel")}</span>
            <NumericInput name="stock" required value={stock} onValue={setStock} />
            {hasVariants ? <small className="admin-field-hint">{t("totalStock", { count: totalStock })}</small> : null}
          </label>
          <label>
            <span className="admin-label">{t("badge")}</span>
            <select name="badge" defaultValue={product?.badge ?? ""} className="admin-select">
              <option value="">{t("none")}</option>
              <option value="NEW">NEW</option>
              <option value="SALE">SALE</option>
              <option value="BESTSELLER">BESTSELLER</option>
              <option value="TRENDING">TRENDING</option>
            </select>
          </label>
          <label>
            <span className="admin-label">{t("status")}</span>
            <select name="status" defaultValue={product?.status ?? "active"} className="admin-select">
              <option value="active">{t("active")}</option>
              <option value="draft">{t("draft")}</option>
            </select>
          </label>
        </div>
        <ProductImagesUpload
          images={images}
          files={imageFiles}
          onChange={(next) => {
            setImages(next.images);
            setImageFiles(next.files);
          }}
        />
        <label>
          <span className="admin-label">{t("sizesLabel")}</span>
          <input name="sizes" className="admin-input" value={sizes} onChange={(event) => setSizes(event.target.value)} />
        </label>
        <label>
          <span className="admin-label">{t("colorsLabel")}</span>
          <input name="colors" className="admin-input" value={colors} onChange={(event) => setColors(event.target.value)} />
        </label>
        {hasVariants ? (
          <div className="admin-variant-block">
            <div className="admin-variant-block__head">
              <span className="admin-label">{t("variantsTitle")}</span>
              <small>{t("variantCount", { count: variants.length })}</small>
            </div>
            {variants.length === 0 ? (
              <p className="admin-empty">{t("variantEmpty")}</p>
            ) : (
              <div className="admin-variant-table-wrap">
                <table className="admin-variant-table">
                  <thead>
                    <tr>
                      <th>{t("variantOption")}</th>
                      <th>{t("sku")}</th>
                      <th>{t("priceCol")}</th>
                      <th>{t("stockCol")}</th>
                      <th>{t("variantImage")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {variants.map((variant) => (
                      <tr key={variant.id}>
                        <td>
                          <strong>{[variant.size, variant.color].filter(Boolean).join(" · ") || t("defaultVariant")}</strong>
                        </td>
                        <td>
                          <input
                            className="admin-input"
                            value={variant.sku}
                            onChange={(event) => patchVariant(variant.id, { sku: event.target.value })}
                          />
                        </td>
                        <td>
                          <NumericInput
                            value={variant.price}
                            onValue={(next) => patchVariant(variant.id, { price: next })}
                          />
                        </td>
                        <td>
                          <NumericInput
                            value={variant.stock}
                            onValue={(next) => patchVariant(variant.id, { stock: next })}
                          />
                        </td>
                        <td>
                          <ImageUpload
                            tile
                            value={variant.image}
                            file={variantFiles[variant.id] ?? null}
                            onFile={(file) => setVariantFiles((current) => ({ ...current, [variant.id]: file }))}
                            onRemove={() => {
                              setVariantFiles((current) => ({ ...current, [variant.id]: null }));
                              patchVariant(variant.id, { image: "" });
                            }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : null}
        <div className="admin-form-actions">
          <Link href="/admin/products" className="admin-text-btn">
            {t("cancel")}
          </Link>
          <button className="btn-gold btn-compact" disabled={pending || !name.trim()}>
            {pending ? t("saving") : product ? t("saveProduct") : t("createProduct")}
          </button>
        </div>
      </form>
    </div>
  );
}
