import { Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type Banner = {
  key: string;
  img: string;
  alt: string;
  /** Internal product slug to open when the banner is clicked. */
  slug: string | null;
  /** Any other destination (absolute URL or site path). Used when slug is empty. */
  url: string | null;
  /** "cover" for a real uploaded banner, "contain" when falling back to a product photo. */
  fit: "cover" | "contain";
};

function BannerLink({ banner, children }: { banner: Banner; children: ReactNode }) {
  const cls = "block w-full";
  if (banner.slug) {
    return (
      <Link to="/product/$slug" params={{ slug: banner.slug }} preload="intent" className={cls}>
        {children}
      </Link>
    );
  }
  if (banner.url) {
    const external = /^https?:\/\//i.test(banner.url);
    return (
      <a href={banner.url} className={cls} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
        {children}
      </a>
    );
  }
  return <div className={cls}>{children}</div>;
}

/** Full-width clickable image banner slider — no overlay text or buttons. */
export function HeroBanner({ banners }: { banners: Banner[] }) {
  const [i, setI] = useState(0);
  const total = banners.length;

  useEffect(() => {
    if (total < 2) return;
    const t = setInterval(() => setI((p) => (p + 1) % total), 5000);
    return () => clearInterval(t);
  }, [total]);

  if (total === 0) {
    return <div className="w-full aspect-[16/7] sm:aspect-[21/7] bg-secondary animate-pulse" />;
  }

  const active = banners[Math.min(i, total - 1)];
  const go = (n: number) => setI((n + total) % total);

  return (
    <section className="relative w-full overflow-hidden bg-secondary">
      <BannerLink banner={active}>
        <img
          key={active.key}
          src={active.img}
          alt={active.alt}
          width={1920}
          height={720}
          loading="eager"
          decoding="async"
          fetchPriority="high"
          className={`w-full aspect-[16/7] sm:aspect-[21/7] ${active.fit === "cover" ? "object-cover" : "object-contain p-6 sm:p-10"}`}
        />
      </BannerLink>

      {total > 1 && (
        <>
          <button
            onClick={() => go(i - 1)}
            aria-label="Previous banner"
            className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full bg-black/40 hover:bg-black/60 text-white items-center justify-center"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => go(i + 1)}
            aria-label="Next banner"
            className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full bg-black/40 hover:bg-black/60 text-white items-center justify-center"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="absolute bottom-3 sm:bottom-5 left-1/2 -translate-x-1/2 flex gap-2 z-20">
            {banners.map((b, idx) => (
              <button
                key={b.key}
                onClick={() => setI(idx)}
                aria-label={`Go to banner ${idx + 1}`}
                className={`h-2 rounded-full transition-all ${idx === i ? "w-8 bg-white" : "w-2 bg-white/60"}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
