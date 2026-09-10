import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, Eye, Flame, Truck, Zap } from "lucide-react";
import { waLinkFor } from "@/lib/products";
import { useProduct, useProducts } from "@/lib/use-products";
import { CustomerOrderForm } from "@/components/CustomerOrderForm";
import { priceToNumber } from "@/lib/use-cart";
import { ProductReviews } from "@/components/ProductReviews";
import { trackTikTokEvent } from "@/utils/tiktokPixel";
import { AnnouncementRibbon, StoreNav, StoreFooter, WhatsAppFloat } from "@/components/StoreChrome";
import { ProductCard, Stars, computeDiscount } from "@/components/ProductCard";
import { useProductRatings, useSiteSettings, formatDuration } from "@/lib/use-site";

export const Route = createFileRoute("/product/$slug")({
  component: ProductPage,
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug.replace(/-/g, " ")} — DesiCart` },
      { name: "description", content: "Premium tech from DesiCart with free delivery across Pakistan." },
      { property: "og:title", content: `${params.slug.replace(/-/g, " ")} — DesiCart` },
      { property: "og:description", content: "Premium tech from DesiCart with free delivery across Pakistan." },
      { property: "og:type", content: "product" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  notFoundComponent: () => (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background text-foreground p-6 text-center">
      <h1 className="font-display text-4xl font-black">Product not found</h1>
      <Link to="/" className="bg-foreground text-background px-6 py-3 rounded-full font-bold">Back to Home</Link>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="min-h-screen flex items-center justify-center p-6 text-center">
      <div>
        <p className="text-destructive font-semibold">{error.message}</p>
        <Link to="/" className="mt-4 inline-block underline">Go home</Link>
      </div>
    </div>
  ),
});

/** Countdown that restarts per visitor, length configured in the admin panel. */
function useSaleCountdown(minutes: number, slug: string) {
  const [remaining, setRemaining] = useState<number>(minutes * 60_000);

  useEffect(() => {
    if (typeof window === "undefined" || !minutes) return;
    const key = `desicart.sale.${slug}`;
    let end = Number(localStorage.getItem(key) || 0);
    if (!end || end < Date.now()) {
      end = Date.now() + minutes * 60_000;
      try { localStorage.setItem(key, String(end)); } catch { /* ignore */ }
    }
    const tick = () => setRemaining(Math.max(0, end - Date.now()));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [minutes, slug]);

  return remaining;
}

function ProductPage() {
  const { slug } = Route.useParams();
  const { product } = useProduct(slug);
  const { products } = useProducts();
  const ratings = useProductRatings();
  const { settings } = useSiteSettings();

  const [activeImg, setActiveImg] = useState<string | null>(null);
  const [activeColor, setActiveColor] = useState<string | null>(null);

  const gallery = useMemo(
    () => (product ? [product.img, ...(product.images ?? []).filter((u) => u && u !== product.img)] : []),
    [product],
  );
  const currentImg = activeImg && gallery.includes(activeImg) ? activeImg : gallery[0];

  useEffect(() => {
    setActiveImg(null);
    setActiveColor(null);
  }, [slug]);

  useEffect(() => {
    if (!product) return;
    trackTikTokEvent("ViewContent", {
      content_type: "product",
      content_id: product.slug,
      content_name: product.name,
      content_category: product.category,
      value: priceToNumber(product.price),
      currency: "PKR",
    });
  }, [product?.slug]);

  const timerMinutes = Number(settings.urgency_timer_minutes) || 1440;
  const remaining = useSaleCountdown(timerMinutes, slug);

  if (!product) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <AnnouncementRibbon />
        <StoreNav />
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="grid md:grid-cols-2 gap-10 animate-pulse">
            <div className="aspect-square rounded-3xl bg-secondary" />
            <div className="space-y-4">
              <div className="h-10 w-3/4 rounded-full bg-secondary" />
              <div className="h-5 w-1/2 rounded-full bg-secondary" />
              <div className="h-24 rounded-2xl bg-secondary" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const discount = computeDiscount(product);
  const rating = ratings[product.slug];
  const related = products.filter((p) => p.slug !== product.slug).slice(0, 4);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AnnouncementRibbon />
      <StoreNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-5">
        <Link to="/" preload="intent" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-accent">
          <ChevronLeft className="h-4 w-4" /> Back to shop
        </Link>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-start">
          {/* Gallery — hover or tap a thumbnail to swap the main photo instantly */}
          <div className="space-y-3">
            <div className="relative rounded-2xl sm:rounded-3xl aspect-square w-full bg-secondary overflow-hidden">
              {product.tag && (
                <span className="absolute top-4 left-4 z-10 text-[10px] uppercase tracking-widest font-bold bg-foreground text-background px-3 py-1.5 rounded-full">{product.tag}</span>
              )}
              {discount !== null && (
                <span className="absolute top-4 right-4 z-10 text-xs font-black text-white bg-red-600 px-3 py-1.5 rounded-full">-{discount}%</span>
              )}
              <img
                src={currentImg}
                alt={product.name}
                width={1000}
                height={1000}
                loading="eager"
                fetchPriority="high"
                className="absolute inset-0 z-[1] w-full h-full object-cover object-center"
              />
            </div>
            {gallery.length > 1 && (
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                {gallery.map((src) => (
                  <button
                    key={src}
                    type="button"
                    onMouseEnter={() => setActiveImg(src)}
                    onFocus={() => setActiveImg(src)}
                    onClick={() => setActiveImg(src)}
                    aria-label="Show this photo"
                    className={`relative aspect-square w-full rounded-xl bg-secondary overflow-hidden border-2 transition-colors ${
                      currentImg === src ? "border-accent" : "border-transparent hover:border-border"
                    }`}
                  >
                    <img src={src} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover object-center" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-5">
            <div>
              <p className="text-accent text-xs font-bold uppercase tracking-widest mb-2">DesiCart Original</p>
              <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-black leading-tight">{product.name}</h1>
              <p className="text-muted-foreground text-sm sm:text-base mt-2">{product.tagline}</p>
            </div>

            <div className="flex items-center gap-2">
              <Stars value={rating?.avg ?? 5} size="h-4 w-4" />
              <span className="text-sm text-muted-foreground">
                {rating?.count ? `${rating.avg.toFixed(1)} · ${rating.count} review${rating.count === 1 ? "" : "s"}` : "Be the first to review"}
              </span>
            </div>

            <div className="flex items-end gap-3">
              <span className="font-display text-3xl sm:text-4xl font-black">{product.price}</span>
              {product.oldPrice && <span className="text-muted-foreground line-through text-lg">{product.oldPrice}</span>}
            </div>

            {/* Urgency banner */}
            <div className="rounded-2xl bg-green-600 text-white px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-1 justify-between">
              <span className="inline-flex items-center gap-2 font-black text-sm sm:text-base">
                <Flame className="h-4 w-4" /> {discount !== null ? `${discount}% OFF` : "SPECIAL PRICE"}
              </span>
              <span className="text-xs sm:text-sm font-bold tabular-nums">
                Sale Might End In {formatDuration(remaining)}
              </span>
            </div>

            {settings.urgency_text && (
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-foreground/80">
                <Eye className="h-4 w-4 text-accent" /> {settings.urgency_text}
              </p>
            )}

            <p className="text-foreground/80 text-sm sm:text-base leading-relaxed">{product.description}</p>

            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {product.features.map((f: string) => (
                <li key={f} className="flex items-start gap-2 text-sm text-foreground/90">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-accent shrink-0" />
                  {f}
                </li>
              ))}
            </ul>

            {product.colors && product.colors.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Color: <span className="text-foreground">{activeColor ?? product.colors[0]}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((c) => {
                    const selected = (activeColor ?? product.colors![0]) === c;
                    const swatch = /^#|^rgb|^oklch|^hsl/i.test(c) ? c : c.toLowerCase();
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setActiveColor(c)}
                        title={c}
                        className={`h-9 min-w-9 px-3 rounded-full border-2 text-xs font-semibold inline-flex items-center gap-2 transition-all ${
                          selected ? "border-accent scale-105" : "border-border hover:border-foreground/40"
                        }`}
                      >
                        <span className="h-4 w-4 rounded-full border border-black/10" style={{ background: swatch }} />
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <CustomerOrderForm product={product} selectedColor={activeColor ?? product.colors?.[0]} />

            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border">
              {[
                { icon: Truck, label: "Free Delivery" },
                { icon: Zap, label: "Fast Dispatch" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex flex-col items-center text-center gap-1.5">
                  <Icon className="h-5 w-5 text-accent" />
                  <span className="text-[11px] sm:text-xs font-semibold">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <ProductReviews productSlug={product.slug} />

        {related.length > 0 && (
          <section className="mt-16">
            <h2 className="font-display text-2xl sm:text-3xl font-black mb-6">You may also like</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5">
              {related.map((p) => (
                <ProductCard key={p.slug} product={p} rating={ratings[p.slug]} />
              ))}
            </div>
          </section>
        )}
      </main>

      <StoreFooter />
      <WhatsAppFloat message={`Hi DesiCart! I'm interested in ${product.name}.`} />
      <a href={waLinkFor(product.name)} className="sr-only">Order {product.name} on WhatsApp</a>
    </div>
  );
}
