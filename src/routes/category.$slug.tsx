import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { ChevronLeft } from "lucide-react";
import { useProducts, useCategories } from "@/lib/use-products";
import { useProductRatings } from "@/lib/use-site";
import { AnnouncementRibbon, StoreNav, StoreFooter, WhatsAppFloat } from "@/components/StoreChrome";
import { ProductCard } from "@/components/ProductCard";

export const Route = createFileRoute("/category/$slug")({
  component: CategoryPage,
  head: ({ params }) => {
    const pretty = params.slug
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
    return {
      meta: [
        { title: `${pretty} — Shop ${pretty} at DesiCart Pakistan` },
        { name: "description", content: `Browse every ${pretty.toLowerCase()} product at DesiCart. Cash on delivery and free delivery across Pakistan.` },
        { property: "og:title", content: `${pretty} — DesiCart` },
        { property: "og:description", content: `Browse every ${pretty.toLowerCase()} product at DesiCart.` },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
});

function CategoryPage() {
  const { slug } = Route.useParams();
  const { products, loading } = useProducts();
  const { categories } = useCategories();
  const ratings = useProductRatings();

  const category = categories.find((c) => c.slug === slug);
  const label = category?.label ?? slug.replace(/-/g, " ");

  const items = useMemo(() => {
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    return products.filter((p) => p.categorySlug === slug || norm(p.category) === slug);
  }, [products, slug]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AnnouncementRibbon />
      <StoreNav />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <Link to="/" preload="intent" className="inline-flex items-center gap-1.5 text-sm font-bold text-muted-foreground hover:text-accent mb-5">
          <ChevronLeft className="h-4 w-4" /> Back to home
        </Link>
        <p className="text-accent text-[11px] font-bold uppercase tracking-widest mb-1">Category</p>
        <h1 className="font-display text-3xl sm:text-5xl font-black capitalize mb-6 sm:mb-8">{label}</h1>

        {items.length === 0 ? (
          <p className="text-muted-foreground py-10">{loading ? "Loading products…" : "No products in this category yet."}</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
            {items.map((p) => (
              <ProductCard key={p.slug} product={p} rating={ratings[p.slug]} />
            ))}
          </div>
        )}
      </main>
      <StoreFooter />
      <WhatsAppFloat />
    </div>
  );
}
