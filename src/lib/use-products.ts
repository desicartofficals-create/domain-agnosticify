import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fallbackImageBySlug, placeholderImg, type Product } from "@/lib/products";
import { createLiveStore } from "@/lib/live-store";

type DbRow = {
  slug: string;
  name: string;
  tagline: string;
  price: string;
  old_price: string | null;
  image_url: string | null;
  tag: string | null;
  category: string;
  description: string;
  features: string[];
  sort_order: number;
  images?: string[] | null;
  colors?: string[] | null;
  sections?: string[] | null;
  discount_percent?: number | null;
  category_slug?: string | null;
  views_count?: number | null;
};

const SELECT_COLS =
  "slug,name,tagline,price,old_price,image_url,tag,category,description,features,sort_order,images,colors,sections,discount_percent,category_slug,views_count";

function mapRow(r: DbRow): Product {
  return {
    slug: r.slug,
    name: r.name,
    tagline: r.tagline,
    price: r.price,
    oldPrice: r.old_price ?? undefined,
    img: r.image_url || fallbackImageBySlug[r.slug] || placeholderImg,
    tag: r.tag ?? undefined,
    category: r.category,
    description: r.description,
    features: r.features ?? [],
    images: r.images ?? [],
    colors: r.colors ?? [],
    sections: r.sections ?? [],
    discountPercent: r.discount_percent ?? undefined,
    categorySlug: r.category_slug ?? undefined,
    viewsCount: r.views_count ?? 0,
  };
}


const productsStore = createLiveStore<Product[]>(
  "products",
  "products",
  async () => {
    const { data, error } = await supabase
      .from("products")
      .select(SELECT_COLS)
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return (data as DbRow[]).map(mapRow);
  },
  [],
);

export function useProducts() {
  const { data, loading } = productsStore.useStore();
  return { products: data, loading };
}

export function useProduct(slug: string) {
  const { products, loading } = useProducts();
  const product = useMemo(() => products.find((p) => p.slug === slug) ?? null, [products, slug]);
  return { product, loading };
}

export type Category = {
  id: string;
  slug: string;
  label: string;
  image_url: string | null;
  link_slug: string;
  sort_order: number;
};

const categoriesStore = createLiveStore<Category[]>(
  "categories",
  "categories",
  async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("id,slug,label,image_url,link_slug,sort_order")
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return (data as Category[]) ?? [];
  },
  [],
);

export function useCategories() {
  const { data, loading } = categoriesStore.useStore();
  return { categories: data, loading };
}

export function useVisitorCount() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const { count: c } = await supabase
        .from("visits")
        .select("*", { count: "exact", head: true });
      if (active) setCount(c ?? 0);
    };
    load();
    const ch = supabase
      .channel(`visits-count-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "visits" }, () => load())
      .subscribe();
    return () => {
      active = false;
      supabase.removeChannel(ch);
    };
  }, []);

  return count;
}

let visitRecorded = false;
export function recordVisit(path: string) {
  if (typeof window === "undefined" || visitRecorded) return;
  visitRecorded = true;
  const key = "desicart.visit.session";
  try {
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
  } catch {
    // ignore
  }
  // Best-effort IP-based geolocation via free public endpoint (no key).
  // Fails silently — visit is still recorded without geo.
  const geo: Promise<{ country: string | null; country_code: string | null; city: string | null }> = fetch(
    "https://ipapi.co/json/",
    { headers: { Accept: "application/json" } },
  )
    .then((r) => (r.ok ? r.json() : null))
    .then((d: { country_name?: string; country_code?: string; city?: string } | null) => ({
      country: d?.country_name ?? null,
      country_code: d?.country_code ?? null,
      city: d?.city ?? null,
    }))
    .catch(() => ({ country: null, country_code: null, city: null }));

  geo.then(({ country, country_code, city }) => {
    supabase
      .from("visits")
      .insert({ path, referrer: document.referrer || null, country, country_code, city })
      .then(() => {})
      .then(undefined, () => {});
  });
}

export type CountryStat = { country: string; count: number };

export function useTopCountries(limit = 8) {
  const [rows, setRows] = useState<CountryStat[]>([]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const { data } = await supabase
        .from("visits")
        .select("country")
        .not("country", "is", null)
        .limit(5000);
      if (!active) return;
      const tally = new Map<string, number>();
      for (const r of (data ?? []) as { country: string | null }[]) {
        if (!r.country) continue;
        tally.set(r.country, (tally.get(r.country) ?? 0) + 1);
      }
      const sorted = Array.from(tally.entries())
        .map(([country, count]) => ({ country, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
      setRows(sorted);
    };
    load();
    const ch = supabase
      .channel(`visits-countries-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "visits" }, () => load())
      .subscribe();
    return () => {
      active = false;
      supabase.removeChannel(ch);
    };
  }, [limit]);

  return rows;
}

export type CityStat = { city: string; count: number };

export function useTopPakistanCities(limit = 10) {
  const [rows, setRows] = useState<CityStat[]>([]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const { data } = await supabase
        .from("visits")
        .select("city")
        .eq("country_code", "PK")
        .not("city", "is", null)
        .limit(5000);
      if (!active) return;
      const tally = new Map<string, number>();
      for (const r of (data ?? []) as { city: string | null }[]) {
        if (!r.city) continue;
        tally.set(r.city, (tally.get(r.city) ?? 0) + 1);
      }
      const sorted = Array.from(tally.entries())
        .map(([city, count]) => ({ city, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
      setRows(sorted);
    };
    load();
    const ch = supabase
      .channel(`visits-pk-cities-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "visits" }, () => load())
      .subscribe();
    return () => {
      active = false;
      supabase.removeChannel(ch);
    };
  }, [limit]);

  return rows;
}