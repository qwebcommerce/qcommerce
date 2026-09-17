"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { newId } from "@/lib/format";
import type { CartLine, Product } from "@/types";

type UiState = {
  searchOpen: boolean;
  cartOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  setCartOpen: (open: boolean) => void;
};

type CartAddExtras = { size?: string; color?: string; quantity?: number; variantId?: string };

type CartState = {
  items: CartLine[];
  count: number;
  subtotal: number;
  add: (product: Product, extras?: CartAddExtras) => void;
  update: (id: string, quantity: number) => void;
  remove: (id: string) => void;
  clear: () => void;
};

type WishlistState = {
  ids: string[];
  toggle: (productId: string) => void;
  remove: (productId: string) => void;
  clear: () => void;
  has: (productId: string) => boolean;
};

const UiContext = createContext<UiState | null>(null);
const CartContext = createContext<CartState | null>(null);
const WishlistContext = createContext<WishlistState | null>(null);

function createLocalStore<T>(key: string, fallback: T) {
  let memory: T | null = null;
  const listeners = new Set<() => void>();

  const read = (): T => {
    if (memory) return memory;
    if (typeof window === "undefined") return fallback;
    try {
      const raw = localStorage.getItem(key);
      memory = raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      memory = fallback;
    }
    return memory;
  };

  const write = (value: T) => {
    memory = value;
    if (typeof window !== "undefined") localStorage.setItem(key, JSON.stringify(value));
    listeners.forEach((listener) => listener());
  };

  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  return { read, write, subscribe, fallback };
}

const cartStore = createLocalStore<CartLine[]>("qc_cart", []);
const wishlistStore = createLocalStore<string[]>("qc_wishlist", []);

export function StoreProviders({ children }: { children: React.ReactNode }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const items = useSyncExternalStore(cartStore.subscribe, cartStore.read, () => cartStore.fallback);
  const ids = useSyncExternalStore(wishlistStore.subscribe, wishlistStore.read, () => wishlistStore.fallback);

  const ui = useMemo(
    () => ({ searchOpen, cartOpen, setSearchOpen, setCartOpen }),
    [searchOpen, cartOpen],
  );

  const add = useCallback((product: Product, extras?: CartAddExtras) => {
    const size = extras?.size;
    const color = extras?.color;
    const quantity = extras?.quantity ?? 1;
    const variant =
      product.hasVariants
        ? product.variants.find((item) => extras?.variantId && item.id === extras.variantId) ??
          product.variants.find((item) => item.size === (size ?? "") && item.color === (color ?? "")) ??
          null
        : null;
    const variantId = variant?.id ?? extras?.variantId;
    const current = cartStore.read();
    const match = current.find(
      (line) =>
        line.productId === product.id &&
        (variantId ? line.variantId === variantId : line.size === size && line.color === color),
    );
    if (match) {
      cartStore.write(current.map((line) => (line.id === match.id ? { ...line, quantity: line.quantity + quantity } : line)));
    } else {
      cartStore.write([
        ...current,
        {
          id: newId("line"),
          productId: product.id,
          name: product.name,
          slug: product.slug,
          image: variant?.image || product.images[0] || "",
          price: variant?.price ?? product.price,
          quantity,
          size: variant?.size || size,
          color: variant?.color || color,
          variantId,
        },
      ]);
    }
    setCartOpen(true);
  }, []);

  const cart = useMemo<CartState>(
    () => ({
      items,
      count: items.reduce((sum, line) => sum + line.quantity, 0),
      subtotal: items.reduce((sum, line) => sum + line.price * line.quantity, 0),
      add,
      update: (id, quantity) => {
        const current = cartStore.read();
        cartStore.write(
          quantity <= 0 ? current.filter((line) => line.id !== id) : current.map((line) => (line.id === id ? { ...line, quantity } : line)),
        );
      },
      remove: (id) => cartStore.write(cartStore.read().filter((line) => line.id !== id)),
      clear: () => cartStore.write([]),
    }),
    [items, add],
  );

  const wishlist = useMemo<WishlistState>(
    () => ({
      ids,
      toggle: (productId) => {
        const current = wishlistStore.read();
        wishlistStore.write(current.includes(productId) ? current.filter((id) => id !== productId) : [...current, productId]);
      },
      remove: (productId) => {
        wishlistStore.write(wishlistStore.read().filter((id) => id !== productId));
      },
      clear: () => wishlistStore.write([]),
      has: (productId) => ids.includes(productId),
    }),
    [ids],
  );

  return (
    <UiContext.Provider value={ui}>
      <CartContext.Provider value={cart}>
        <WishlistContext.Provider value={wishlist}>{children}</WishlistContext.Provider>
      </CartContext.Provider>
    </UiContext.Provider>
  );
}

function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}

export function useUi() {
  const value = useContext(UiContext);
  if (!value) throw new Error("useUi must be used within StoreProviders");
  return value;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used within StoreProviders");
  const hydrated = useHydrated();
  return hydrated ? value : { ...value, items: [], count: 0, subtotal: 0 };
}

export function useWishlist() {
  const value = useContext(WishlistContext);
  if (!value) throw new Error("useWishlist must be used within StoreProviders");
  const hydrated = useHydrated();
  return hydrated ? value : { ...value, ids: [], has: () => false };
}
