import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Search, ShoppingCart, Menu, MessageCircle, User, X } from "lucide-react";
import logoImg from "@/assets/desicart-logo.png";
import { openCart, useCart } from "@/lib/use-cart";
import { useCategories, useProducts } from "@/lib/use-products";
import { useCountdown, formatDuration, useSiteSettings, SOCIAL_KEYS } from "@/lib/use-site";
import { WHATSAPP_NUMBER } from "@/lib/products";

export function AnnouncementRibbon() {
  const { settings } = useSiteSettings();
  const remaining = useCountdown(settings.ribbon_countdown_end || null);
  if (settings.ribbon_enabled === "false") return null;
  const text = settings.ribbon_text || "";
  const line = remaining !== null ? `${text}  ${formatDuration(remaining)}` : text;
  if (!line.trim()) return null;

  return (
    <div
      className="overflow-hidden py-2 text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em]"
      style={{ background: settings.ribbon_bg || "#0f9d58", color: settings.ribbon_fg || "#ffffff" }}
    >
      <div className="flex w-max animate-marquee whitespace-nowrap">
        {[0, 1].map((k) => (
          <span key={k} className="flex">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className="px-8">{line}</span>
            ))}
          </span>
        ))}
      </div>
    </div>
  );
}

function InstantSearch({ onNavigate }: { onNavigate?: () => void }) {
  const { products } = useProducts();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [];
    const words = term.split(/\s+/);
    return products
      .map((p) => {
        const hay = `${p.name} ${p.tagline} ${p.category} ${p.categorySlug ?? ""} ${p.slug}`.toLowerCase();
        const score = words.reduce((s, w) => (hay.includes(w) ? s + (p.name.toLowerCase().includes(w) ? 2 : 1) : s), 0);
        return { p, score, all: words.every((w) => hay.includes(w)) };
      })
      .filter((r) => r.all)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map((r) => r.p);
  }, [q, products]);

  return (
    <div ref={boxRef} className="relative w-full">
      <div className="flex items-center gap-2 h-10 rounded-full border border-border bg-secondary/60 px-4">
        <Search className="h-4 w-4 text-muted-foreground shrink-0" />
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Search products…"
          aria-label="Search products"
          className="w-full bg-transparent text-sm outline-none min-w-0"
        />
        {q && (
          <button onClick={() => { setQ(""); setOpen(false); }} aria-label="Clear search" className="shrink-0 text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      {open && q.trim() && (
        <div className="absolute left-0 right-0 top-12 z-50 rounded-2xl border border-border bg-background shadow-product overflow-hidden">
          {results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted-foreground">No products match “{q}”.</p>
          ) : (
            results.map((p) => (
              <Link
                key={p.slug}
                to="/product/$slug"
                params={{ slug: p.slug }}
                preload="intent"
                onClick={() => { setQ(""); setOpen(false); onNavigate?.(); }}
                className="flex items-center gap-3 px-3 py-2.5 hover:bg-secondary transition-colors"
              >
                <img src={p.img} alt="" loading="lazy" className="h-10 w-10 object-contain shrink-0" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold truncate">{p.name}</span>
                  <span className="block text-xs text-muted-foreground truncate">{p.tagline}</span>
                </span>
                <span className="text-sm font-black shrink-0">{p.price}</span>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export function StoreNav() {
  const [open, setOpen] = useState(false);
  const { count } = useCart();
  const { categories } = useCategories();
  const links = categories.slice(0, 6).map((c) => ({ label: c.label, slug: c.slug }));

  return (
    <nav className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 sm:gap-6">
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => setOpen((v) => !v)} aria-label="Menu" className="md:hidden text-foreground"><Menu className="h-6 w-6" /></button>
          <Link to="/" preload="intent">
            <img src={logoImg} alt="DesiCart" className="h-8 sm:h-10 w-auto logo-orange" />
          </Link>
        </div>
        <div className="hidden sm:block min-w-0 max-w-xl mx-auto w-full"><InstantSearch /></div>
        <div className="flex items-center gap-3 sm:gap-4 text-foreground shrink-0">
          <a href="#support" aria-label="Support" className="hidden sm:inline hover:text-accent transition-colors"><User className="h-5 w-5" /></a>
          <button onClick={openCart} aria-label="Cart" className="relative hover:text-accent transition-colors">
            <ShoppingCart className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -top-2 -right-2 bg-accent text-accent-foreground text-[10px] h-4 min-w-4 px-1 rounded-full flex items-center justify-center font-bold">{count}</span>
            )}
          </button>
        </div>
      </div>
      <div className="sm:hidden px-4 pb-3"><InstantSearch /></div>
      {open && (
        <div className="md:hidden border-t border-border bg-background px-4 py-3">
          <div className="flex flex-col gap-3 text-sm font-semibold text-foreground/80">
            <Link to="/" preload="intent" onClick={() => setOpen(false)} className="py-1 hover:text-accent">Home</Link>
            {links.map((l) => (
              <Link key={l.label} to="/category/$slug" params={{ slug: l.slug }} preload="intent" onClick={() => setOpen(false)} className="py-1 hover:text-accent">
                {l.label}
              </Link>
            ))}
            <a href="#support" onClick={() => setOpen(false)} className="py-1 hover:text-accent">Support</a>
          </div>
        </div>
      )}
    </nav>
  );
}

const SOCIAL_LABEL: Record<string, string> = {
  facebook: "Facebook",
  x: "X",
  instagram: "Instagram",
  pinterest: "Pinterest",
  youtube: "YouTube",
  tiktok: "TikTok",
  linkedin: "LinkedIn",
  snapchat: "Snapchat",
};

const SOCIAL_ICON: Record<string, string> = {
  facebook: "f",
  x: "𝕏",
  instagram: "◎",
  pinterest: "P",
  youtube: "▶",
  tiktok: "♪",
  linkedin: "in",
  snapchat: "◠",
};

export function StoreFooter() {
  const { settings } = useSiteSettings();
  const socials = SOCIAL_KEYS.map((k) => ({ key: k, url: settings[`social_${k}`] })).filter((s) => s.url);

  return (
    <footer id="support" className="border-t border-border bg-secondary/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-12 flex flex-col items-center gap-6 text-center">
        <img src={logoImg} alt="DesiCart" className="h-9 w-auto logo-orange" />
        <p className="text-sm text-muted-foreground max-w-md">Premium tech. Pakistani roots. Free delivery all over Pakistan.</p>

        {socials.length > 0 && (
          <div className="flex flex-wrap justify-center gap-3">
            {socials.map((s) => (
              <a
                key={s.key}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={SOCIAL_LABEL[s.key]}
                title={SOCIAL_LABEL[s.key]}
                className="h-10 w-10 rounded-full border border-border bg-background flex items-center justify-center text-sm font-bold text-foreground hover:bg-foreground hover:text-background hover:-translate-y-0.5 transition-all"
              >
                {SOCIAL_ICON[s.key]}
              </a>
            ))}
          </div>
        )}

        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs font-semibold text-muted-foreground">
          <Link to="/" preload="intent" className="hover:text-accent">Home</Link>
          <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer" className="hover:text-accent">WhatsApp Support</a>
          <Link to="/admin" className="hover:text-accent">Admin Panel</Link>
        </div>
      </div>
      <div className="border-t border-border py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} DesiCart. All rights reserved.
      </div>
    </footer>
  );
}

export function WhatsAppFloat({ message = "Hi DesiCart! I have a question." }: { message?: string }) {
  return (
    <a
      href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-5 right-5 z-50 h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-whatsapp flex items-center justify-center shadow-2xl animate-pulse-ring hover:scale-110 transition-transform"
    >
      <MessageCircle className="h-6 w-6 sm:h-7 sm:w-7 text-white" fill="white" />
    </a>
  );
}
