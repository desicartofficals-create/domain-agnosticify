import { useEffect, useState } from "react";
import type { Product } from "@/lib/products";

export type CartItem = {
  slug: string;
  name: string;
  price: string;
  img: string;
  qty: number;
  color?: string;
};

const STORAGE_KEY = "desicart.cart.v1";
const CART_EVENT = "desicart:cart-changed";
const OPEN_EVENT = "desicart:cart-open";

function read(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

function write(items: CartItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent(CART_EVENT));
}

export function priceToNumber(price: string): number {
  const n = parseInt(price.replace(/[^0-9]/g, ""), 10);
  return isNaN(n) ? 0 : n;
}

export function openCart() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(OPEN_EVENT));
}

export function onCartOpen(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  const handler = () => cb();
  window.addEventListener(OPEN_EVENT, handler);
  return () => window.removeEventListener(OPEN_EVENT, handler);
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    setItems(read());
    const refresh = () => setItems(read());
    window.addEventListener(CART_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(CART_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const addItem = (product: Pick<Product, "slug" | "name" | "price" | "img">, qty = 1, color?: string) => {
    const current = read();
    const idx = current.findIndex((i) => i.slug === product.slug && (i.color ?? "") === (color ?? ""));
    if (idx >= 0) current[idx].qty += qty;
    else current.push({ slug: product.slug, name: product.name, price: product.price, img: product.img, qty, color });
    write(current);
  };

  const keyOf = (slug: string, color?: string) => `${slug}::${color ?? ""}`;

  const setQty = (slug: string, qty: number, color?: string) => {
    const current = read();
    const next = current
      .map((i) => (keyOf(i.slug, i.color) === keyOf(slug, color) ? { ...i, qty: Math.max(0, qty) } : i))
      .filter((i) => i.qty > 0);
    write(next);
  };

  const removeItem = (slug: string, color?: string) => {
    write(read().filter((i) => keyOf(i.slug, i.color) !== keyOf(slug, color)));
  };

  const clear = () => write([]);

  const count = items.reduce((sum, i) => sum + i.qty, 0);
  const subtotal = items.reduce((sum, i) => sum + priceToNumber(i.price) * i.qty, 0);

  return { items, addItem, setQty, removeItem, clear, count, subtotal };
}