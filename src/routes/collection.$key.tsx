import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { useProducts } from "@/lib/use-products";
import { useProductRatings } from "@/lib/use-site";
import { AnnouncementRibbon, StoreNav, StoreFooter, WhatsAppFloat } from "@/components/StoreChrome";
import { ProductCard } from "@/components/ProductCard";
import { collectionByKey } from "@/lib/collections";

export const Route = createFileRoute("/collection/$key")({
  component: CollectionPage,
  head: ({ params }) => {
    const c = collectionByKey(params.key);
    const title = c?.title ?? "All Products";
    return {
      meta: [
        { title: `${title} — DesiCart Pakistan` },
        { name: "description", content: `${title} at DesiCart — ${c?.kicker ?? "everything in store"}. Cash on delivery across Pakistan.` },
        { property: "og:title", content: `${title} — DesiCart` },
        { property: "og:description", content: `${title} at DesiCart — ${c?.kicker ?? "everything in store"}.` },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
});

function CollectionPage() {
  const { key } = Route.useParams();
  const { products, loading } = useProducts();
  const ratings = useProductRatings();
  const collection = collectionByKey(key);

  const items = collection ? products.filter((p) => (p.sections ?? []).includes(key)) : products;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AnnouncementRibbon />
      <StoreNav />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <Link to="/" preload="intent" className="inline-flex items-center gap-1.5 text-sm font-bold text-muted-foreground hover:text-accent mb-5">
          <ChevronLeft className="h-4 w-4" /> Back to home
        </Link>
        <p className="text-accent text-[11px] font-bold uppercase tracking-widest mb-1">{collection?.kicker ?? "Everything in store"}</p>
        <h1 className="font-display text-3xl sm:text-5xl font-black mb-6 sm:mb-8">{collection?.title ?? "All Products"}</h1>

        {items.length === 0 ? (
          <p className="text-muted-foreground py-10">{loading ? "Loading products…" : "Nothing here yet."}</p>
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
