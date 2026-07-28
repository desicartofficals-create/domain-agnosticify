import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search, ShoppingCart, Menu, MessageCircle, Truck, Headphones as HeadphonesIcon, Zap, Star, ChevronRight, ChevronLeft, User } from "lucide-react";
import { useProducts, useCategories, recordVisit, type Category } from "@/lib/use-products";
import { openCart, useCart } from "@/lib/use-cart";
import { waLinkFor } from "@/lib/products";
import logoImg from "@/assets/desicart-logo.png";
import watchImg from "@/assets/ultra3-watch.png";
import earbudsImg from "@/assets/airpods-pro-2.png";
import headphonesImg from "@/assets/akg-handsfree.png";
import speakerImg from "@/assets/kts-1185-speaker.png";
import powerbankImg from "@/assets/powerbank.png";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "DesiCart — Premium Smartwatches, Earbuds & Headphones" },
      { name: "description", content: "Shop premium smartwatches, earbuds and headphones at DesiCart. Order on WhatsApp with free delivery across Pakistan." },
    ],
  }),
});

function Navbar() {
  const [open, setOpen] = useState(false);
  const { count } = useCart();
  const links = [
    { label: "Home", href: "/" },
    { label: "Smart Watches", href: "/product/ultra-3-smartwatch" },
    { label: "Earbuds", href: "/product/airpods-pro-2-black" },
    { label: "Speakers", href: "/product/kts-1185-speaker" },
    { label: "Accessories", href: "/product/super-charger-powerbank" },
    { label: "Support", href: "#support" },
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
          <a href="#products" aria-label="Search products" className="hover:text-accent transition-colors"><Search className="h-5 w-5" /></a>
          <a href="#support" aria-label="Account support" className="hidden sm:inline hover:text-accent transition-colors"><User className="h-5 w-5" /></a>
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

function HeroSlider({ products }: { products: ReturnType<typeof useProducts>["products"] }) {
  const [i, setI] = useState(0);
  const total = products.length;

  useEffect(() => {
    if (total === 0) return;
    const t = setInterval(() => setI((p) => (p + 1) % total), 5000);
    return () => clearInterval(t);
  }, [total]);

  const go = (n: number) => setI((n + total) % total);

  if (total === 0) {
    // Skeleton hero — renders immediately so slideshow area appears first
    return (
      <section className="relative bg-hero-gradient overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-16 md:py-20 min-h-[480px] md:min-h-[600px]">
          <div className="grid md:grid-cols-2 gap-8 items-center animate-pulse">
            <div className="space-y-5 text-center md:text-left order-2 md:order-1">
              <div className="h-6 w-32 rounded-full bg-white/25 mx-auto md:mx-0" />
              <div className="h-16 sm:h-24 w-3/4 rounded-2xl bg-white/25 mx-auto md:mx-0" />
              <div className="h-6 w-2/3 rounded-full bg-white/20 mx-auto md:mx-0" />
              <div className="h-12 w-40 rounded-full bg-white/30 mx-auto md:mx-0" />
            </div>
            <div className="order-1 md:order-2 flex justify-center">
              <div className="h-56 w-56 sm:h-72 sm:w-72 md:h-80 md:w-80 rounded-full bg-white/25" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative bg-hero-gradient overflow-hidden">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-16 md:py-20 min-h-[480px] md:min-h-[600px]">
        {products.map((p, idx) => (
          <div
            key={p.slug}
            className={`grid md:grid-cols-2 gap-8 items-center transition-opacity duration-300 ${
              idx === i ? "opacity-100 relative" : "opacity-0 absolute inset-0 px-4 sm:px-6 py-10 sm:py-16 md:py-20 pointer-events-none"
            }`}
          >
            <div className="space-y-5 sm:space-y-6 text-center md:text-left z-10 order-2 md:order-1 max-w-xl">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur text-[10px] sm:text-xs font-bold uppercase tracking-widest text-white">
                <Zap className="h-3 w-3" /> {p.tag ?? "Featured"}
              </span>
              <h1 className="font-display text-4xl sm:text-6xl md:text-8xl font-black leading-[0.85] text-white drop-shadow-lg uppercase">
                {p.name.split(" ").slice(0, 2).join(" ")}
              </h1>
              <p className="font-display text-base sm:text-lg md:text-xl text-white/90 uppercase tracking-[0.2em] font-semibold">
                {p.tagline}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-center md:items-start justify-center md:justify-start pt-2">
                <Link
                  to="/product/$slug"
                  params={{ slug: p.slug }}
                  className="group inline-flex items-center gap-2 bg-white text-black font-bold uppercase tracking-wider text-xs sm:text-sm px-7 sm:px-9 py-3.5 sm:py-4 rounded-full hover:scale-105 transition-transform shadow-glow"
                >
                  Shop Now
                  <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <a
                  href={waLinkFor(p.name)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 border-2 border-white/70 text-white font-bold uppercase tracking-wider text-xs sm:text-sm px-6 sm:px-8 py-3 sm:py-3.5 rounded-full hover:bg-white hover:text-black transition-colors"
                >
                  <MessageCircle className="h-4 w-4" /> Order on WhatsApp
                </a>
              </div>
            </div>
            <div className="relative flex items-center justify-center order-1 md:order-2">
              <div className="absolute h-56 w-56 sm:h-72 sm:w-72 md:h-[28rem] md:w-[28rem] rounded-full bg-white/20 blur-3xl" />
              <img
                src={p.img}
                alt={p.name}
                width={1024}
                height={1024}
                loading={idx === 0 ? "eager" : "lazy"}
                decoding="async"
                fetchPriority={idx === 0 ? "high" : "low"}
                className="relative z-10 w-56 sm:w-72 md:w-full md:max-w-lg animate-float drop-shadow-2xl"
              />
            </div>
          </div>
        ))}

        <button onClick={() => go(i - 1)} aria-label="Previous slide" className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-20 h-11 w-11 rounded-full bg-white/20 backdrop-blur hover:bg-white/40 text-white items-center justify-center transition-colors">
          <ChevronLeft className="h-6 w-6" />
        </button>
        <button onClick={() => go(i + 1)} aria-label="Next slide" className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-20 h-11 w-11 rounded-full bg-white/20 backdrop-blur hover:bg-white/40 text-white items-center justify-center transition-colors">
          <ChevronRight className="h-6 w-6" />
        </button>

        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {products.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setI(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={`h-2 rounded-full transition-all ${idx === i ? "w-8 bg-white" : "w-2 bg-white/50"}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

const fallbackCategories = [
  { label: "Smart Watches", img: watchImg, slug: "ultra-3-smartwatch" },
  { label: "Earbuds", img: earbudsImg, slug: "airpods-pro-2-black" },
  { label: "Speakers", img: speakerImg, slug: "kts-1185-speaker" },
  { label: "Power Banks", img: powerbankImg, slug: "super-charger-powerbank" },
  { label: "Headphones", img: headphonesImg, slug: "akg-handsfree" },
];

const fallbackImageForCategory: Record<string, string> = {
  "smart-watches": watchImg,
  "earbuds": earbudsImg,
  "speakers": speakerImg,
  "power-banks": powerbankImg,
  "headphones": headphonesImg,
};

function Categories() {
  const { categories } = useCategories();
  const items: { label: string; img: string; slug: string }[] =
    categories.length > 0
      ? categories.map((c: Category) => ({
          label: c.label,
          img: c.image_url || fallbackImageForCategory[c.slug] || placeholderCat,
          slug: c.link_slug,
        }))
      : fallbackCategories;
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6">
        {items.map((c) => (
          <Link key={c.label} to="/product/$slug" params={{ slug: c.slug }} className="flex flex-col items-center gap-2.5 group">
            <div className="category-icon relative h-20 w-20 sm:h-28 sm:w-28 rounded-full bg-gradient-to-br from-secondary to-background border border-border/70 flex items-center justify-center overflow-hidden shadow-[0_8px_24px_-16px_rgba(0,0,0,0.35)]">
              <img src={c.img} alt={c.label} loading="lazy" className="relative z-10 h-3/4 w-3/4 object-contain transition-transform duration-500 group-hover:scale-110" />
            </div>
            <span className="text-[11px] sm:text-sm font-bold text-center text-foreground group-hover:text-accent transition-colors">{c.label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

const placeholderCat = watchImg;

function FeatureStrip() {
  const items = [
    { icon: Truck, label: "Free Delivery" },
    { icon: HeadphonesIcon, label: "24/7 Support" },
    { icon: Zap, label: "Fast Charging" },
  ];
  return (
    <section className="border-y border-border bg-secondary/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 grid grid-cols-3 gap-4 sm:gap-6">
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

function Products({ products }: { products: ReturnType<typeof useProducts>["products"] }) {
  return (
    <section id="products" className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
      <div className="flex items-end justify-between mb-8 sm:mb-12">
        <div>
          <p className="text-accent text-xs font-bold uppercase tracking-widest mb-2">Shop the Drop</p>
          <h2 className="font-display text-3xl sm:text-4xl md:text-6xl font-black text-foreground">Featured Products</h2>
        </div>
        <a href="#products" className="hidden md:inline-flex items-center gap-2 text-sm font-semibold text-foreground hover:text-accent transition-colors">
          View All <ChevronRight className="h-4 w-4" />
        </a>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6">
        {products.map((p) => (
          <Link
            key={p.slug}
            to="/product/$slug"
            params={{ slug: p.slug }}
            className="group bg-card border border-border rounded-2xl sm:rounded-3xl p-3 sm:p-6 hover:border-accent/50 transition-all hover:-translate-y-1 hover:shadow-product duration-300 block"
          >
            <div className="relative aspect-square rounded-xl sm:rounded-2xl bg-secondary overflow-hidden mb-3 sm:mb-6 flex items-center justify-center">
              {p.tag && <span className="absolute top-3 left-3 z-10 text-[10px] uppercase tracking-widest font-bold bg-accent text-accent-foreground px-2.5 py-1 rounded-full">{p.tag}</span>}
              <img src={p.img} alt={p.name} loading="lazy" width={1024} height={1024} className="w-3/4 h-3/4 object-contain group-hover:scale-110 transition-transform duration-500" />
            </div>
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="font-display text-sm sm:text-xl font-bold text-foreground leading-tight">{p.name}</h3>
              <div className="flex shrink-0 pt-1">{[...Array(5)].map((_, i) => <Star key={i} className="h-3 w-3 fill-current" style={{ color: "var(--neon-green)" }} />)}</div>
            </div>
            <p className="text-muted-foreground text-[11px] sm:text-sm mb-3 sm:mb-4">{p.tagline}</p>
            <div className="flex items-center justify-between gap-2">
              <span className="font-display text-base sm:text-2xl font-black text-foreground">{p.price}</span>
              <span className="bg-foreground text-background px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold group-hover:bg-accent transition-colors">
                Shop Now
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function Footer() {
  const footerGroups = [
    { title: "Shop", links: [{ label: "Smart Watches", href: "/product/ultra-3-smartwatch" }, { label: "Earbuds", href: "/product/airpods-pro-2-black" }, { label: "Speakers", href: "/product/kts-1185-speaker" }, { label: "Power Banks", href: "/product/super-charger-powerbank" }] },
    { title: "Support", links: [{ label: "WhatsApp Support", href: `https://wa.me/923214028277?text=${encodeURIComponent("Hi DesiCart! I need support.")}` }, { label: "Order Help", href: "#products" }, { label: "Free Delivery", href: "#products" }] },
    { title: "Company", links: [{ label: "Home", href: "/" }, { label: "Featured Products", href: "#products" }, { label: "Contact", href: `https://wa.me/923214028277?text=${encodeURIComponent("Hi DesiCart! I want to contact you.")}` }, { label: "Admin Panel", href: "/admin" }] },
  ];

  return (
    <footer id="support" className="border-t border-border bg-secondary/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-12 grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
        <div className="col-span-2 md:col-span-1">
          <img src={logoImg} alt="DesiCart" className="h-9 w-auto mb-3 logo-orange" />
          <p className="text-sm text-muted-foreground">Premium tech. Pakistani roots.</p>
        </div>
        {footerGroups.map((group) => (
          <div key={group.title}>
            <p className="font-bold mb-3 text-xs sm:text-sm uppercase tracking-widest text-foreground">{group.title}</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {group.links.map((link) => (
                <li key={link.label}><a href={link.href} className="hover:text-accent">{link.label}</a></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border py-5 text-center text-xs text-muted-foreground">
        © 2026 DesiCart. All rights reserved.
      </div>
    </footer>
  );
}

function WhatsAppFloat() {
  return (
    <a
      href={`https://wa.me/923214028277?text=${encodeURIComponent("Hi DesiCart! I have a question.")}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-5 right-5 z-50 h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-whatsapp flex items-center justify-center shadow-2xl animate-pulse-ring hover:scale-110 transition-transform"
    >
      <MessageCircle className="h-6 w-6 sm:h-7 sm:w-7 text-white" fill="white" />
    </a>
  );
}

function Index() {
  const { products } = useProducts();
  useEffect(() => {
    recordVisit("/");
  }, []);
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main>
        <HeroSlider products={products} />
        <Categories />
        <FeatureStrip />
        <Products products={products} />
      </main>
      <Footer />
      <WhatsAppFloat />
    </div>
  );
}
