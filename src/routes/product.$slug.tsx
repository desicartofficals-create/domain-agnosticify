import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronLeft, MessageCircle, ShoppingCart, Star, Truck, Zap, Search, Menu, User, X, ChevronRight } from "lucide-react";
import logoImg from "@/assets/desicart-logo.png";
import { waLinkFor } from "@/lib/products";
import { useProduct, useProducts } from "@/lib/use-products";
import { CustomerOrderForm } from "@/components/CustomerOrderForm";
import { openCart, useCart } from "@/lib/use-cart";
import { ProductReviews } from "@/components/ProductReviews";

export const Route = createFileRoute("/product/$slug")({
  component: ProductPage,
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug} — DesiCart` },
      { name: "description", content: "Premium tech from DesiCart" },
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

function MiniNav() {
  const [open, setOpen] = useState(false);
  const { count } = useCart();
  const links = [
    { label: "Home", href: "/" },
    { label: "Smart Watches", href: "/product/ultra-3-smartwatch" },
    { label: "Earbuds", href: "/product/airpods-pro-2-black" },
    { label: "Speakers", href: "/product/kts-1185-speaker" },
    { label: "Accessories", href: "/product/super-charger-powerbank" },
    { label: "Support", href: "https://wa.me/923214028277?text=Hi%20DesiCart!%20I%20need%20support." },
  ];

  return (
    <nav className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setOpen((v) => !v)} aria-label="Menu" className="md:hidden text-foreground"><Menu className="h-6 w-6" /></button>
          <Link to="/">
            <img src={logoImg} alt="DesiCart" className="h-8 sm:h-10 w-auto logo-orange" />
          </Link>
        </div>
        <ul className="hidden md:flex items-center gap-8 text-sm font-medium text-foreground/80">
          {links.map((link) => (
            <li key={link.label}><a href={link.href} className="hover:text-accent transition-colors">{link.label}</a></li>
          ))}
        </ul>
        <div className="flex items-center gap-3 sm:gap-4 text-foreground">
          <Link to="/" aria-label="Search products" className="hover:text-accent transition-colors"><Search className="h-5 w-5" /></Link>
          <a href="https://wa.me/923214028277?text=Hi%20DesiCart!%20I%20need%20support." target="_blank" rel="noopener noreferrer" aria-label="Account support" className="hidden sm:inline hover:text-accent transition-colors"><User className="h-5 w-5" /></a>
          <button onClick={openCart} aria-label="Cart" className="relative hover:text-accent transition-colors">
            <ShoppingCart className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -top-2 -right-2 bg-accent text-accent-foreground text-[10px] h-4 min-w-4 px-1 rounded-full flex items-center justify-center font-bold">{count}</span>
            )}
          </button>
        </div>
      </div>
      {open && (
        <div className="md:hidden border-t border-border bg-background px-4 py-3">
          <div className="flex flex-col gap-3 text-sm font-semibold text-foreground/80">
            {links.map((link) => (
              <a key={link.label} href={link.href} onClick={() => setOpen(false)} className="py-1 hover:text-accent transition-colors">{link.label}</a>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}

function ProductPage() {
  const { slug } = Route.useParams();
  const { product, loading } = useProduct(slug);
  const { products } = useProducts();
  const [activeImg, setActiveImg] = useState<string | null>(null);
  const [activeColor, setActiveColor] = useState<string | null>(null);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const gallery = product
    ? [product.img, ...((product.images ?? []).filter((u) => u && u !== product.img))]
    : [];
  const currentImg = activeImg ?? gallery[0] ?? product?.img;
  const currentIdx = Math.max(0, gallery.indexOf(currentImg ?? ""));

  useEffect(() => {
    setActiveImg(null);
    setActiveColor(null);
    setLightboxIdx(null);
  }, [slug]);

  useEffect(() => {
    if (lightboxIdx === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxIdx(null);
      else if (e.key === "ArrowRight") setLightboxIdx((i) => (i === null ? 0 : (i + 1) % gallery.length));
      else if (e.key === "ArrowLeft") setLightboxIdx((i) => (i === null ? 0 : (i - 1 + gallery.length) % gallery.length));
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [lightboxIdx, gallery.length]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background text-foreground p-6 text-center">
        <h1 className="font-display text-4xl font-black">Product not found</h1>
        <Link to="/" className="bg-foreground text-background px-6 py-3 rounded-full font-bold">Back to Home</Link>
      </div>
    );
  }

  const wa = waLinkFor(product.name);
  const related = products.filter((p) => p.slug !== product.slug);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <MiniNav />

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-accent transition-colors">
          <ChevronLeft className="h-4 w-4" /> Back to shop
        </Link>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-start">
          {/* Image */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setLightboxIdx(currentIdx)}
              aria-label="View full-screen image"
              className={`relative rounded-2xl sm:rounded-3xl aspect-square w-full flex items-center justify-center overflow-hidden group cursor-zoom-in ${
                currentImg === product.img ? "bg-hero-gradient" : "bg-white"
              }`}
            >
              {product.tag && (
                <span className="absolute top-4 left-4 z-10 text-[10px] uppercase tracking-widest font-bold bg-white text-black px-3 py-1.5 rounded-full">{product.tag}</span>
              )}
              <div className="absolute h-2/3 w-2/3 rounded-full bg-white/20 blur-3xl" />
              <img
                src={currentImg}
                alt={product.name}
                width={1024}
                height={1024}
                loading="eager"
                className={`relative z-10 object-contain drop-shadow-2xl ${
                  currentImg === product.img
                    ? "w-3/4 h-3/4 animate-float group-hover:scale-105 transition-transform"
                    : "w-full h-full"
                }`}
              />
            </button>
            {gallery.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {gallery.map((src, idx) => (
                  <button
                    key={src}
                    type="button"
                    onClick={() => { setActiveImg(src); setLightboxIdx(idx); }}
                    className={`shrink-0 h-16 w-16 sm:h-20 sm:w-20 rounded-xl bg-secondary flex items-center justify-center overflow-hidden border-2 transition-colors ${
                      currentImg === src ? "border-accent" : "border-transparent hover:border-border"
                    }`}
                  >
                    <img
                      src={src}
                      alt=""
                      loading="lazy"
                      className={`object-contain ${
                        src === product.img ? "w-3/4 h-3/4" : "w-full h-full"
                      }`}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-5 sm:space-y-6">
            <div>
              <p className="text-accent text-xs font-bold uppercase tracking-widest mb-2">DesiCart Original</p>
              <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-black text-foreground leading-tight">
                {product.name}
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base mt-2">{product.tagline}</p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex">{[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-current" style={{ color: "var(--neon-green)" }} />)}</div>
              <span className="text-sm text-muted-foreground">4.9 · 2,134 reviews</span>
            </div>

            <div className="flex items-end gap-3">
              <span className="font-display text-3xl sm:text-4xl font-black text-foreground">{product.price}</span>
              {product.oldPrice && (
                <span className="text-muted-foreground line-through text-lg">{product.oldPrice}</span>
              )}
            </div>

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
                        aria-label={c}
                        title={c}
                        className={`h-9 min-w-9 px-3 rounded-full border-2 text-xs font-semibold inline-flex items-center gap-2 transition-all ${
                          selected ? "border-accent scale-105" : "border-border hover:border-foreground/40"
                        }`}
                      >
                        <span
                          className="h-4 w-4 rounded-full border border-black/10"
                          style={{ background: swatch }}
                        />
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <CustomerOrderForm product={product} selectedColor={activeColor ?? product.colors?.[0]} />

            {/* Trust strip */}
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border">
              {[
                { icon: Truck, label: "Free Delivery" },
                { icon: Zap, label: "Fast Dispatch" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex flex-col items-center text-center gap-1.5">
                  <Icon className="h-5 w-5 text-accent" />
                  <span className="text-[11px] sm:text-xs font-semibold text-foreground">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Reviews */}
        <ProductReviews productSlug={product.slug} />

        {/* Related */}
        <section className="mt-16 sm:mt-24">
          <h2 className="font-display text-2xl sm:text-3xl font-black text-foreground mb-6">You may also like</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {related.map((p) => (
              <Link
                key={p.slug}
                to="/product/$slug"
                params={{ slug: p.slug }}
                className="group bg-card border border-border rounded-2xl p-4 sm:p-6 hover:border-accent/50 transition-all hover:-translate-y-1 flex items-center gap-4"
              >
                <div className="h-24 w-24 sm:h-32 sm:w-32 rounded-xl bg-secondary flex items-center justify-center shrink-0 overflow-hidden">
                  <img src={p.img} alt={p.name} className="w-3/4 h-3/4 object-contain group-hover:scale-110 transition-transform" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display text-base sm:text-lg font-bold text-foreground truncate">{p.name}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">{p.tagline}</p>
                  <span className="font-display text-base sm:text-lg font-black text-foreground mt-1 inline-block">{p.price}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>

      <a
        href={wa}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        className="fixed bottom-5 right-5 z-50 h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-whatsapp flex items-center justify-center shadow-2xl animate-pulse-ring hover:scale-110 transition-transform"
      >
        <MessageCircle className="h-6 w-6 sm:h-7 sm:w-7 text-white" fill="white" />
      </a>

      {lightboxIdx !== null && gallery.length > 0 && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center animate-in fade-in"
          onClick={() => setLightboxIdx(null)}
        >
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setLightboxIdx(null); }}
            aria-label="Close"
            className="absolute top-4 right-4 h-11 w-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
          >
            <X className="h-6 w-6" />
          </button>
          {gallery.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setLightboxIdx((i) => (i === null ? 0 : (i - 1 + gallery.length) % gallery.length)); }}
                aria-label="Previous"
                className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setLightboxIdx((i) => (i === null ? 0 : (i + 1) % gallery.length)); }}
                aria-label="Next"
                className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}
          <img
            src={gallery[lightboxIdx]}
            alt={product.name}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[88vh] max-w-[92vw] object-contain drop-shadow-2xl"
          />
          {gallery.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
              {gallery.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setLightboxIdx(i); }}
                  aria-label={`Image ${i + 1}`}
                  className={`h-2 rounded-full transition-all ${i === lightboxIdx ? "w-8 bg-white" : "w-2 bg-white/40 hover:bg-white/70"}`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
