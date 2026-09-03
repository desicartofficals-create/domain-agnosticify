import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Star } from "lucide-react";
import type { Product } from "@/lib/products";
import { priceToNumber } from "@/lib/use-cart";
import type { RatingStat } from "@/lib/use-site";

function swatchColor(c: string) {
  return /^#|^rgb|^oklch|^hsl/i.test(c) ? c : c.toLowerCase();
}

export function computeDiscount(p: Product): number | null {
  if (p.discountPercent && p.discountPercent > 0) return p.discountPercent;
  if (!p.oldPrice) return null;
  const oldV = priceToNumber(p.oldPrice);
  const newV = priceToNumber(p.price);
  if (!oldV || !newV || oldV <= newV) return null;
  return Math.round(((oldV - newV) / oldV) * 100);
}

export function Stars({ value, size = "h-3.5 w-3.5" }: { value: number; size?: string }) {
  return (
    <span className="flex" aria-label={`${value.toFixed(1)} out of 5`}>
      {[0, 1, 2, 3, 4].map((i) => (
        <Star
          key={i}
          className={`${size} ${i < Math.round(value) ? "fill-current" : "opacity-25"}`}
          style={{ color: "var(--neon-green)" }}
        />
      ))}
    </span>
  );
}

export function ProductCard({ product, rating }: { product: Product; rating?: RatingStat }) {
  const [color, setColor] = useState<string | null>(null);
  const discount = computeDiscount(product);
  const colors = product.colors ?? [];

  return (
    <div className="group relative bg-card border border-border rounded-2xl sm:rounded-3xl p-3 sm:p-5 hover:border-accent/50 hover:-translate-y-1 hover:shadow-product transition-all duration-300 flex flex-col">
      {discount !== null && (
        <span className="absolute top-3 right-3 z-10 text-[10px] sm:text-xs font-black text-white bg-red-600 px-2.5 py-1 rounded-full shadow-sm">
          -{discount}%
        </span>
      )}
      <Link to="/product/$slug" params={{ slug: product.slug }} preload="intent" className="block">
        <div className="relative aspect-square rounded-xl sm:rounded-2xl bg-secondary overflow-hidden mb-3 flex items-center justify-center">
          <img
            src={product.img}
            alt={product.name}
            loading="lazy"
            width={800}
            height={800}
            className="w-3/4 h-3/4 object-contain group-hover:scale-110 transition-transform duration-500"
          />
        </div>
        <h3 className="font-display text-sm sm:text-lg font-bold text-foreground leading-tight line-clamp-2">{product.name}</h3>
      </Link>

      <div className="mt-1.5 flex items-center gap-1.5">
        <Stars value={rating?.avg ?? 5} />
        <span className="text-[11px] text-muted-foreground">
          {rating?.count ? `${rating.avg.toFixed(1)} (${rating.count})` : "New"}
        </span>
      </div>

      {colors.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {colors.slice(0, 6).map((c) => {
            const selected = (color ?? colors[0]) === c;
            return (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                aria-label={c}
                title={c}
                className={`h-5 w-5 rounded-full border-2 transition-transform ${selected ? "border-accent scale-110" : "border-border"}`}
                style={{ background: swatchColor(c) }}
              />
            );
          })}
        </div>
      )}

      <div className="mt-2 flex items-baseline gap-2">
        {product.oldPrice && <span className="text-xs sm:text-sm text-muted-foreground line-through">{product.oldPrice}</span>}
        <span className="font-display text-base sm:text-xl font-black text-foreground">{product.price}</span>
      </div>

      <Link
        to="/product/$slug"
        params={{ slug: product.slug }}
        search={colors.length > 0 ? undefined : undefined}
        preload="intent"
        className="mt-3 h-10 rounded-full bg-black text-white text-xs sm:text-sm font-bold flex items-center justify-center hover:bg-accent transition-colors"
      >
        Buy Now
      </Link>
    </div>
  );
}
