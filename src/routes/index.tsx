import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import { Truck, Headphones as HeadphonesIcon, Zap, ChevronRight } from "lucide-react";
import { useProducts, useCategories, recordVisit, type Category } from "@/lib/use-products";
import { useHeroSlides, useProductRatings, type HeroSlide } from "@/lib/use-site";
import type { Product } from "@/lib/products";
import { AnnouncementRibbon, StoreNav, StoreFooter, WhatsAppFloat } from "@/components/StoreChrome";
import { ProductCard } from "@/components/ProductCard";
import { HeroBanner, type Banner } from "@/components/HeroBanner";
import { COLLECTIONS } from "@/lib/collections";
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
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 sm:gap-6">
        {categories.map((c: Category) => (
          <Link
            key={c.id}
            to="/category/$slug"
            params={{ slug: c.slug }}
            preload="intent"
            className="flex flex-col items-center gap-2.5 group"
          >
            <div className="category-icon relative h-20 w-20 sm:h-28 sm:w-28 rounded-full bg-gradient-to-br from-secondary to-background border border-border/70 flex items-center justify-center overflow-hidden">
              <img
                src={c.image_url || fallbackImageForCategory[c.slug] || watchImg}
                alt={c.label}
                loading="lazy"
                decoding="async"
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

function ProductRow({
  title,
  kicker,
  products,
  ratings,
  viewAllKey,
}: {
  title: string;
  kicker: string;
  products: Product[];
  ratings: Record<string, { avg: number; count: number }>;
  viewAllKey: string;
}) {
  if (products.length === 0) return null;
  const visible = products.slice(0, 4);

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="flex items-end justify-between gap-3 mb-5 sm:mb-8">
        <div className="min-w-0">
          <p className="text-accent text-[11px] font-bold uppercase tracking-widest mb-1">{kicker}</p>
          <h2 className="font-display text-2xl sm:text-4xl font-black text-foreground truncate">{title}</h2>
        </div>
        <Link
          to="/collection/$key"
          params={{ key: viewAllKey }}
          preload="intent"
          className="shrink-0 inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-foreground hover:text-accent"
        >
          View all <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 items-stretch">
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

  const banners: Banner[] = useMemo(() => {
    const bySlug = new Map(products.map((p) => [p.slug, p]));
    return dbSlides
      .map((s: HeroSlide) => {
        const p = s.link_slug ? bySlug.get(s.link_slug) : undefined;
        const img = s.image_url || p?.img;
        if (!img) return null;
        return {
          key: s.id,
          img,
          alt: s.title || p?.name || "DesiCart banner",
          slug: s.link_slug ?? null,
          url: s.link_url ?? null,
          fit: s.image_url ? "cover" : "contain",
        } satisfies Banner;
      })
      .filter(Boolean) as Banner[];
  }, [dbSlides, products]);

  const rows = COLLECTIONS.map((s) => ({
    ...s,
    items: products.filter((p) => (p.sections ?? []).includes(s.key)),
  }));

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AnnouncementRibbon />
      <StoreNav />
      <main>
        <HeroBanner banners={banners} />
        <Categories />
        <FeatureStrip />
        {rows.map((r) => (
          <ProductRow key={r.key} title={r.title} kicker={r.kicker} products={r.items} ratings={ratings} viewAllKey={r.key} />
        ))}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="flex items-end justify-between gap-3 mb-5 sm:mb-8">
            <div className="min-w-0">
              <p className="text-accent text-[11px] font-bold uppercase tracking-widest mb-1">Everything in store</p>
              <h2 className="font-display text-2xl sm:text-4xl font-black text-foreground truncate">All Products</h2>
            </div>
            <Link to="/collection/$key" params={{ key: "all" }} preload="intent" className="shrink-0 inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-foreground hover:text-accent">
              View all <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 items-stretch">
            {products.slice(0, 8).map((p) => (
              <ProductCard key={p.slug} product={p} rating={ratings[p.slug]} />
            ))}
          </div>
        </section>
      </main>
      <StoreFooter />
      <WhatsAppFloat />
    </div>
  );
}
