import type { Category } from "@/types";
import { themeCategoryName, type Locale } from "@/theme.config";

export type CategoryTree = Category & { children: Category[] };

export function nestCategories(categories: Category[]): CategoryTree[] {
  const byParent = new Map<string, Category[]>();
  for (const category of categories) {
    if (!category.parentId) continue;
    const list = byParent.get(category.parentId) ?? [];
    list.push(category);
    byParent.set(category.parentId, list);
  }
  return categories
    .filter((category) => !category.parentId)
    .map((category) => ({
      ...category,
      children: byParent.get(category.id) ?? [],
    }));
}

export function slugsForCategory(categories: Category[], slug: string): string[] {
  const match = categories.find((category) => category.slug === slug);
  if (!match) return [slug];
  if (match.parentId) return [match.slug];
  return [match.slug, ...categories.filter((child) => child.parentId === match.id).map((child) => child.slug)];
}

export function categoryPathLabel(categories: Category[], slug: string, fallback: string) {
  const match = categories.find((category) => category.slug === slug);
  if (!match) return fallback;
  if (!match.parentId) return match.name;
  const parent = categories.find((category) => category.id === match.parentId);
  return parent ? `${parent.name} / ${match.name}` : match.name;
}

export function localizedCategoryName(category: Pick<Category, "name" | "nameAr" | "slug">, locale: Locale) {
  if (locale === "ar") return category.nameAr || themeCategoryName(category.slug)?.ar || category.name;
  return category.name;
}

export function localizedCategorySubtitle(category: Pick<Category, "subtitle" | "subtitleAr">, locale: Locale) {
  if (locale === "ar") return category.subtitleAr || category.subtitle;
  return category.subtitle;
}

export function matchesCategorySearch(category: Category, query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return [category.name, category.nameAr, category.subtitle, category.subtitleAr, category.slug]
    .join(" ")
    .toLowerCase()
    .includes(needle);
}

export function filterCategoryTree(tree: CategoryTree[], query: string): CategoryTree[] {
  if (!query.trim()) return tree;
  return tree.flatMap((parent) => {
    const parentHit = matchesCategorySearch(parent, query);
    const children = parent.children.filter((child) => matchesCategorySearch(child, query));
    if (parentHit) return [parent];
    if (children.length) return [{ ...parent, children }];
    return [];
  });
}
