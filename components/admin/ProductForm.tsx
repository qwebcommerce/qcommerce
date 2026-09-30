"use client";

import { useEffect, useMemo, useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ProductImagesUpload from "@/components/admin/ProductImagesUpload";
import AdminSelect from "@/components/admin/AdminSelect";
import { saveProductAction } from "@/lib/actions";
import { DROPSHIP_UI_ENABLED } from "@/lib/dropship";
import { nestCategories } from "@/lib/categories";
import { csvList, productStock, syncProductVariants } from "@/lib/products";
import { usePreferences } from "@/lib/preferences";
import { useToast } from "@/lib/toast";
import type { Category, Product, ProductSource, ProductVariant } from "@/types";

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

export default function ProductForm({
  product,
  categories,
  dropshipBuffer = 3,
}: {
  product?: Product;
  categories: Category[];
  dropshipBuffer?: number;
}) {
  const { t } = usePreferences();
  const toast = useToast();
  const router = useRouter();
  const tree = nestCategories(categories);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [name, setName] = useState(product?.name ?? "");
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
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [source, setSource] = useState<ProductSource>(product?.source ?? "warehouse");
  const [supplierStock, setSupplierStock] = useState(product?.supplierStock ?? product?.stock ?? 0);
  const [categoryId, setCategoryId] = useState(
    categories.find((category) => category.slug === product?.categorySlug)?.id ?? tree[0]?.id ?? "",
  );
  const [badge, setBadge] = useState(product?.badge ?? "");
  const [status, setStatus] = useState(product?.status ?? "active");
  const categoryOptions = tree.flatMap((parent) => [
    { value: parent.id, label: parent.name },
    ...parent.children.map((child) => ({
      value: child.id,
      label: `${parent.name} / ${child.name}`,
    })),
  ]);
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

  function patchVariant(id: string, patch: Partial<ProductVariant>) {
    setVariants((current) => current.map((variant) => (variant.id === id ? { ...variant, ...patch } : variant)));
  }

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const status = String(new FormData(event.currentTarget).get("status") ?? "active");
    if (!images.length && !imageFiles.length && status !== "draft") {
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
            <input name="name" required className="admin-input" value={name} onChange={(event) => setName(event.target.value)} />
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
          <div>
            <span className="admin-label">{t("productCategory")}</span>
            <input type="hidden" name="categoryId" value={categoryId} />
            <AdminSelect
              value={categoryId}
              aria-label={t("productCategory")}
              options={categoryOptions}
              onChange={setCategoryId}
            />
          </div>
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
          <div>
            <span className="admin-label">{t("badge")}</span>
            <input type="hidden" name="badge" value={badge} />
            <AdminSelect
              value={badge}
              aria-label={t("badge")}
              options={[
                { value: "", label: t("none") },
                { value: "NEW", label: "NEW" },
                { value: "SALE", label: "SALE" },
                { value: "BESTSELLER", label: "BESTSELLER" },
                { value: "TRENDING", label: "TRENDING" },
              ]}
              onChange={setBadge}
            />
          </div>
          <div>
            <span className="admin-label">{t("status")}</span>
            <input type="hidden" name="status" value={status} />
            <AdminSelect
              value={status}
              aria-label={t("status")}
              options={[
                { value: "active", label: t("active") },
                { value: "draft", label: t("draft") },
              ]}
              onChange={(value) => setStatus(value === "draft" ? "draft" : "active")}
            />
          </div>
          {DROPSHIP_UI_ENABLED ? (
            <div>
              <span className="admin-label">{t("productSource")}</span>
              <input type="hidden" name="source" value={source} />
              <AdminSelect
                value={source}
                aria-label={t("productSource")}
                options={[
                  { value: "warehouse", label: t("sourceWarehouse") },
                  { value: "aliexpress", label: t("sourceAliexpress") },
                  { value: "temu", label: t("sourceTemu") },
                ]}
                onChange={(value) => setSource(value as ProductSource)}
              />
            </div>
          ) : (
            <input type="hidden" name="source" value={product?.source ?? "warehouse"} />
          )}
        </div>
        {DROPSHIP_UI_ENABLED && source !== "warehouse" ? (
          <div className="admin-form-grid">
            <label>
              <span className="admin-label">{t("supplierUrl")}</span>
              <input name="supplierUrl" className="admin-input" defaultValue={product?.supplierUrl} />
            </label>
            <label>
              <span className="admin-label">{t("supplierProductId")}</span>
              <input name="supplierProductId" className="admin-input" defaultValue={product?.supplierProductId} />
            </label>
            <label>
              <span className="admin-label">{t("supplierStock")}</span>
              <NumericInput name="supplierStock" value={supplierStock} onValue={setSupplierStock} />
              <small className="admin-field-hint">
                {t("sellableAfterBuffer", { count: Math.max(0, supplierStock - dropshipBuffer) })}
              </small>
            </label>
          </div>
        ) : (
          <>
            <input type="hidden" name="supplierUrl" value={product?.supplierUrl ?? ""} />
            <input type="hidden" name="supplierProductId" value={product?.supplierProductId ?? ""} />
            <input type="hidden" name="supplierStock" value={String(product?.supplierStock ?? stock)} />
          </>
        )}
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
