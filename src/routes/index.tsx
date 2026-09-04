import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Truck, Headphones as HeadphonesIcon, Zap, ChevronRight, ChevronLeft, MessageCircle } from "lucide-react";
import { useProducts, useCategories, recordVisit, type Category } from "@/lib/use-products";
import { useHeroSlides, useProductRatings, type HeroSlide } from "@/lib/use-site";
import { waLinkFor, type Product } from "@/lib/products";
import { AnnouncementRibbon, StoreNav, StoreFooter, WhatsAppFloat } from "@/components/StoreChrome";
import { ProductCard } from "@/components/ProductCard";
import watchImg from "@/assets/ultra3-watch.png";
import earbudsImg from "@/assets/airpods-pro-2.png";
import headphonesImg from "@/assets/akg-handsfree.png";
import speakerImg from "@/assets/kts-1185-speaker.png";
import powerbankImg from "@/assets/powerbank.png";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "DesiCart — Premium Smartwatches, Earbuds & Gadgets in Pakistan" },
      { name: "description", content: "Shop premium smartwatches, earbuds, speakers and gadgets at DesiCart. Cash on delivery and free delivery across Pakistan." },
      { property: "og:title", content: "DesiCart — Premium Tech at Desi Prices" },
      { property: "og:description", content: "Smartwatches, earbuds, speakers and gadgets with free delivery across Pakistan." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

/* ---------------- Hero slider with dominant-colour gradient ---------------- */

const FALLBACK_GRADIENT = "linear-gradient(135deg, #f0a04b 0%, #b25b2a 55%, #4a2412 100%)";

function useDominantColor(src: string | undefined) {
  const [gradient, setGradient] = useState(FALLBACK_GRADIENT);

  useEffect(() => {
    if (!src || typeof window === "undefined") return;
    let cancelled = false;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = src;
    const run = () => {
      try {
        const size = 24;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, size, size);
        const { data } = ctx.getImageData(0, 0, size, size);
        let r = 0, g = 0, b = 0, n = 0;
        for (let i = 0; i < data.length; i += 4) {
          const alpha = data[i + 3];
          if (alpha < 128) continue;
          const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          if (lum > 240 || lum < 12) continue;
          r += data[i]; g += data[i + 1]; b += data[i + 2]; n++;
        }
        if (!n || cancelled) return;
        r = Math.round(r / n); g = Math.round(g / n); b = Math.round(b / n);
        const dark = (c: number) => Math.round(c * 0.35);
        const light = (c: number) => Math.min(255, Math.round(c * 1.35));
        setGradient(
          `radial-gradient(ellipse at 70% 45%, rgb(${light(r)},${light(g)},${light(b)}) 0%, rgb(${r},${g},${b}) 45%, rgb(${dark(r)},${dark(g)},${dark(b)}) 100%)`,
        );
      } catch {
        // tainted canvas or unsupported — keep the fallback gradient
      }
    };
    if (img.complete) run();
    else img.onload = run;
    return () => { cancelled = true; };
  }, [src]);

  return gradient;
}

type Slide = { key: string; title: string; subtitle: string; badge: string; img: string; slug: string | null };

function HeroSlider({ slides }: { slides: Slide[] }) {
  const [i, setI] = useState(0);
  const total = slides.length;
  const active = slides[Math.min(i, Math.max(0, total - 1))];
  const gradient = useDominantColor(active?.img);

  useEffect(() => {
    if (total < 2) return;
    const t = setInterval(() => setI((p) => (p + 1) % total), 5000);
    return () => clearInterval(t);
  }, [total]);

  if (total === 0 || !active) {
    return <section className="min-h-[320px] md:min-h-[460px]" style={{ background: FALLBACK_GRADIENT }} />;
  }

  const go = (n: number) => setI((n + total) % total);

  return (
    <section className="relative overflow-hidden transition-[background] duration-500" style={{ background: gradient }}>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14 md:py-20 min-h-[420px] md:min-h-[560px] grid md:grid-cols-2 gap-8 items-center">
        <div className="space-y-5 text-center md:text-left order-2 md:order-1">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur text-[10px] sm:text-xs font-bold uppercase tracking-widest text-white">
            <Zap className="h-3 w-3" /> {active.badge}
          </span>
          <h1 className="font-display text-4xl sm:text-6xl md:text-7xl font-black leading-[0.9] text-white drop-shadow-lg uppercase">
            {active.title}
          </h1>
          <p className="font-display text-base sm:text-lg text-white/90 uppercase tracking-[0.2em] font-semibold">{active.subtitle}</p>
          <div className="flex flex-col sm:flex-row gap-3 items-center md:items-start justify-center md:justify-start pt-1">
            {active.slug && (
              <Link
                to="/product/$slug"
                params={{ slug: active.slug }}
                preload="intent"
                className="group inline-flex items-center gap-2 bg-white text-black font-bold uppercase tracking-wider text-xs sm:text-sm px-8 py-3.5 rounded-full hover:scale-105 transition-transform shadow-glow"
              >
                Shop Now <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            )}
            <a
              href={waLinkFor(active.title)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border-2 border-white/70 text-white font-bold uppercase tracking-wider text-xs sm:text-sm px-7 py-3 rounded-full hover:bg-white hover:text-black transition-colors"
            >
              <MessageCircle className="h-4 w-4" /> Order on WhatsApp
            </a>
          </div>
        </div>
        <div className="relative flex items-center justify-center order-1 md:order-2">
          <div className="absolute h-52 w-52 sm:h-72 sm:w-72 md:h-[26rem] md:w-[26rem] rounded-full bg-white/20 blur-3xl" />
          <img
            key={active.key}
            src={active.img}
            alt={active.title}
            width={900}
            height={900}
            loading="eager"
            decoding="async"
            fetchPriority="high"
            className="relative z-10 w-52 sm:w-72 md:w-full md:max-w-md animate-float drop-shadow-2xl"
          />
        </div>

        {total > 1 && (
          <>
            <button onClick={() => go(i - 1)} aria-label="Previous slide" className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-20 h-11 w-11 rounded-full bg-white/20 backdrop-blur hover:bg-white/40 text-white items-center justify-center">
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button onClick={() => go(i + 1)} aria-label="Next slide" className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-20 h-11 w-11 rounded-full bg-white/20 backdrop-blur hover:bg-white/40 text-white items-center justify-center">
              <ChevronRight className="h-6 w-6" />
            </button>
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 z-20">
              {slides.map((s, idx) => (
                <button key={s.key} onClick={() => setI(idx)} aria-label={`Go to slide ${idx + 1}`} className={`h-2 rounded-full transition-all ${idx === i ? "w-8 bg-white" : "w-2 bg-white/50"}`} />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

/* ---------------- Categories ---------------- */

const fallbackImageForCategory: Record<string, string> = {
  "smart-watches": watchImg,
  earbuds: earbudsImg,
  speakers: speakerImg,
  "power-banks": powerbankImg,
  headphones: headphonesImg,
};

function Categories() {
  const { categories } = useCategories();
  if (categories.length === 0) return null;
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 sm:gap-6">
        {categories.map((c: Category) => (
          <Link key={c.id} to="/product/$slug" params={{ slug: c.link_slug }} preload="intent" className="flex flex-col items-center gap-2.5 group">
            <div className="category-icon relative h-20 w-20 sm:h-28 sm:w-28 rounded-full bg-gradient-to-br from-secondary to-background border border-border/70 flex items-center justify-center overflow-hidden">
              <img
                src={c.image_url || fallbackImageForCategory[c.slug] || watchImg}
                alt={c.label}
                loading="lazy"
                className="relative z-10 h-3/4 w-3/4 object-contain transition-transform duration-300 group-hover:scale-110"
              />
            </div>
            <span className="text-[11px] sm:text-sm font-bold text-center text-foreground group-hover:text-accent transition-colors">{c.label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function FeatureStrip() {
  const items = [
    { icon: Truck, label: "Free Delivery" },
    { icon: HeadphonesIcon, label: "24/7 Support" },
    { icon: Zap, label: "Cash on Delivery" },
  ];
  return (
    <section className="border-y border-border bg-secondary/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-3 gap-4">
        {items.map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-2 sm:gap-3 justify-center md:justify-start">
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-accent/15 flex items-center justify-center shrink-0">
              <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
            </div>
            <span className="font-semibold text-xs sm:text-sm text-foreground">{label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------------- Product rows ---------------- */

const SECTIONS: { key: string; title: string; kicker: string }[] = [
  { key: "best-sellers", title: "Best Sellers", kicker: "Most loved by customers" },
  { key: "best-offers", title: "Best Offers", kicker: "Biggest savings right now" },
  { key: "just-launched", title: "Just Launched", kicker: "Fresh in the store" },
];

function ProductRow({
  title,
  kicker,
  products,
  ratings,
}: {
  title: string;
  kicker: string;
  products: Product[];
  ratings: Record<string, { avg: number; count: number }>;
}) {
  const [showAll, setShowAll] = useState(false);
  if (products.length === 0) return null;
  const visible = showAll ? products : products.slice(0, 4);

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="flex items-end justify-between gap-3 mb-5 sm:mb-8">
        <div className="min-w-0">
          <p className="text-accent text-[11px] font-bold uppercase tracking-widest mb-1">{kicker}</p>
          <h2 className="font-display text-2xl sm:text-4xl font-black text-foreground truncate">{title}</h2>
        </div>
        {products.length > 4 && (
          <button
            onClick={() => setShowAll((v) => !v)}
            className="shrink-0 inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-foreground hover:text-accent"
          >
            {showAll ? "Show less" : "View all"} <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5">
        {visible.map((p) => (
          <ProductCard key={p.slug} product={p} rating={ratings[p.slug]} />
        ))}
      </div>
    </section>
  );
}

/* ---------------- Page ---------------- */

function Index() {
  const { products } = useProducts();
  const dbSlides = useHeroSlides(true);
  const ratings = useProductRatings();

  useEffect(() => {
    recordVisit("/");
  }, []);

  const slides: Slide[] = useMemo(() => {
    const bySlug = new Map(products.map((p) => [p.slug, p]));
    const built = dbSlides
      .map((s: HeroSlide) => {
        const p = s.link_slug ? bySlug.get(s.link_slug) : undefined;
        const img = s.image_url || p?.img;
        if (!img) return null;
        return {
          key: s.id,
          title: s.title || p?.name || "DesiCart",
          subtitle: s.subtitle || p?.tagline || "",
          badge: s.badge || p?.tag || "Featured",
          img,
          slug: s.link_slug ?? null,
        } satisfies Slide;
      })
      .filter(Boolean) as Slide[];
    if (built.length > 0) return built;
    return products.slice(0, 3).map((p) => ({
      key: p.slug,
      title: p.name,
      subtitle: p.tagline,
      badge: p.tag ?? "Featured",
      img: p.img,
      slug: p.slug,
    }));
  }, [dbSlides, products]);

  const rows = SECTIONS.map((s) => ({
    ...s,
    items: products.filter((p) => (p.sections ?? []).includes(s.key)),
  }));
  const unsectioned = products.filter((p) => (p.sections ?? []).length === 0);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AnnouncementRibbon />
      <StoreNav />
      <main>
        <HeroSlider slides={slides} />
        <Categories />
        <FeatureStrip />
        {rows.map((r) => (
          <ProductRow key={r.key} title={r.title} kicker={r.kicker} products={r.items} ratings={ratings} />
        ))}
        <ProductRow title="All Products" kicker="Everything in store" products={unsectioned.length > 0 ? products : []} ratings={ratings} />
      </main>
      <StoreFooter />
      <WhatsAppFloat />
    </div>
  );
}
