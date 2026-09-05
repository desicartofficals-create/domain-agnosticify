import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type SettingsMap = Record<string, string>;

export const SOCIAL_KEYS = [
  "facebook",
  "x",
  "instagram",
  "pinterest",
  "youtube",
  "tiktok",
  "linkedin",
  "snapchat",
] as const;

export type SocialKey = (typeof SOCIAL_KEYS)[number];

export const DEFAULT_SETTINGS: SettingsMap = {
  ribbon_enabled: "true",
  ribbon_text: "LIMITED STOCK LEFT!",
  ribbon_bg: "#0f9d58",
  ribbon_fg: "#ffffff",
  ribbon_countdown_end: "",
  urgency_text: "1361+ People viewed this in the last 7 days",
  urgency_timer_minutes: "1440",
};

/** Reads all editable site settings; updates live for every visitor. */
export function useSiteSettings() {
  const [settings, setSettings] = useState<SettingsMap>(DEFAULT_SETTINGS);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const { data } = await supabase.from("site_settings").select("key,value");
      if (!active || !data) return;
      const map: SettingsMap = { ...DEFAULT_SETTINGS };
      for (const row of data as { key: string; value: string }[]) map[row.key] = row.value;
      setSettings(map);
    };
    load();
    const ch = supabase
      .channel(`site-settings-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "site_settings" }, () => load())
      .subscribe();
    return () => {
      active = false;
      supabase.removeChannel(ch);
    };
  }, []);

  const saveSetting = useCallback(async (key: string, value: string) => {
    const { error } = await supabase.from("site_settings").upsert({ key, value }, { onConflict: "key" });
    if (error) throw error;
    setSettings((s) => ({ ...s, [key]: value }));
  }, []);

  return { settings, saveSetting };
}

export type HeroSlide = {
  id: string;
  title: string;
  subtitle: string;
  badge: string | null;
  image_url: string | null;
  link_slug: string | null;
  sort_order: number;
  active: boolean;
};

export function useHeroSlides(onlyActive = true) {
  const [slides, setSlides] = useState<HeroSlide[]>([]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      let q = supabase.from("hero_slides").select("*").order("sort_order", { ascending: true });
      if (onlyActive) q = q.eq("active", true);
      const { data } = await q;
      if (active) setSlides((data as HeroSlide[]) ?? []);
    };
    load();
    const ch = supabase
      .channel(`hero-slides-${onlyActive ? "public" : "admin"}-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "hero_slides" }, () => load())
      .subscribe();
    return () => {
      active = false;
      supabase.removeChannel(ch);
    };
  }, [onlyActive]);

  return slides;
}

export type RatingStat = { avg: number; count: number };

/** Real star ratings, aggregated per product slug from the reviews table. */
export function useProductRatings() {
  const [ratings, setRatings] = useState<Record<string, RatingStat>>({});

  useEffect(() => {
    let active = true;
    const load = async () => {
      const { data } = await supabase.from("reviews").select("product_slug,rating").limit(5000);
      if (!active || !data) return;
      const tally: Record<string, { sum: number; count: number }> = {};
      for (const r of data as { product_slug: string; rating: number }[]) {
        const t = (tally[r.product_slug] ??= { sum: 0, count: 0 });
        t.sum += r.rating;
        t.count += 1;
      }
      const out: Record<string, RatingStat> = {};
      for (const [slug, t] of Object.entries(tally)) out[slug] = { avg: t.sum / t.count, count: t.count };
      setRatings(out);
    };
    load();
    const ch = supabase
      .channel(`reviews-ratings-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "reviews" }, () => load())
      .subscribe();
    return () => {
      active = false;
      supabase.removeChannel(ch);
    };
  }, []);

  return ratings;
}

/** Milliseconds remaining until an ISO date, ticking every second. */
export function useCountdown(endsAt: string | null | undefined) {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!endsAt) {
      setRemaining(null);
      return;
    }
    const target = new Date(endsAt).getTime();
    if (Number.isNaN(target)) {
      setRemaining(null);
      return;
    }
    const tick = () => setRemaining(Math.max(0, target - Date.now()));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [endsAt]);

  return remaining;
}

export function formatDuration(ms: number) {
  const total = Math.floor(ms / 1000);
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return d > 0 ? `${d}d ${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(h)}:${pad(m)}:${pad(s)}`;
}
