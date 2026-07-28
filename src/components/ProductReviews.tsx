import { useEffect, useState, type FormEvent } from "react";
import { Loader2, Star, Upload, ImageIcon, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type Review = {
  id: string;
  product_slug: string;
  customer_name: string;
  rating: number;
  comment: string;
  image_url: string | null;
  created_at: string;
};

export function ProductReviews({ productSlug }: { productSlug: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("product_slug", productSlug)
        .order("created_at", { ascending: false })
        .limit(50);
      if (!active) return;
      if (error) console.error(error);
      setReviews((data as Review[]) ?? []);
      setLoading(false);
    };
    load();
    return () => {
      active = false;
    };
  }, [productSlug]);

  const pickFile = (f: File | null) => {
    setFile(f);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(f ? URL.createObjectURL(f) : null);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !comment.trim()) {
      toast.error("Please enter your name and a comment.");
      return;
    }
    setBusy(true);
    let image_url: string | null = null;
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be under 5MB.");
        setBusy(false);
        return;
      }
      const ext = file.name.split(".").pop() || "jpg";
      const path = `reviews/${productSlug}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("product-images")
        .upload(path, file, { contentType: file.type });
      if (upErr) {
        toast.error(upErr.message);
        setBusy(false);
        return;
      }
      image_url = supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;
    }
    const { data, error } = await supabase
      .from("reviews")
      .insert({
        product_slug: productSlug,
        customer_name: name.trim().slice(0, 80),
        rating,
        comment: comment.trim().slice(0, 1000),
        image_url,
      })
      .select()
      .single();
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Thanks for your review!");
    setReviews((r) => [data as Review, ...r]);
    setName("");
    setComment("");
    setRating(5);
    pickFile(null);
    setShowForm(false);
  };

  const avg = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <section className="mt-16 sm:mt-24">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-5">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-black text-foreground">Customer Reviews</h2>
          {avg && (
            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
              <Star className="h-4 w-4 fill-current text-[color:var(--neon-green)]" />
              <span className="font-bold text-foreground">{avg}</span> · {reviews.length} review{reviews.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-full bg-accent text-accent-foreground px-5 py-2.5 text-sm font-bold hover:scale-[1.02] transition-transform"
        >
          {showForm ? "Cancel" : "Write a review"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="rounded-2xl border border-border bg-card p-5 space-y-3 mb-6 animate-in fade-in duration-200">
          <div className="grid sm:grid-cols-2 gap-3">
            <input
              placeholder="Your name"
              value={name}
              maxLength={80}
              onChange={(e) => setName(e.target.value)}
              className="h-11 rounded-full border border-input bg-background px-4 text-sm outline-none focus:border-accent"
              required
            />
            <div className="flex items-center gap-1 h-11 rounded-full border border-input bg-background px-4">
              <span className="text-xs text-muted-foreground mr-2">Rating:</span>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  aria-label={`${n} star${n > 1 ? "s" : ""}`}
                  className="p-1"
                >
                  <Star
                    className={`h-5 w-5 transition-colors ${n <= rating ? "fill-current text-[color:var(--neon-green)]" : "text-muted-foreground/40"}`}
                  />
                </button>
              ))}
            </div>
          </div>
          <textarea
            placeholder="Share your experience with this product…"
            value={comment}
            maxLength={1000}
            onChange={(e) => setComment(e.target.value)}
            className="w-full min-h-24 rounded-2xl border border-input bg-background p-3 text-sm outline-none focus:border-accent"
            required
          />
          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex items-center gap-2 rounded-full border border-input bg-background px-4 py-2 text-sm font-semibold cursor-pointer hover:border-accent">
              <Upload className="h-4 w-4" />
              {file ? "Change photo" : "Add photo (optional)"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
              />
            </label>
            {preview && (
              <div className="relative">
                <img src={preview} alt="Preview" className="h-14 w-14 rounded-lg object-cover border border-border" />
                <button
                  type="button"
                  onClick={() => pickFile(null)}
                  className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-destructive text-white flex items-center justify-center"
                  aria-label="Remove photo"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            <button
              type="submit"
              disabled={busy}
              className="ml-auto inline-flex items-center gap-2 rounded-full bg-foreground text-background px-5 py-2.5 text-sm font-bold disabled:opacity-50"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              Post review
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-accent" /></div>
      ) : reviews.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No reviews yet. Be the first to review this product!
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {reviews.map((r) => (
            <article key={r.id} className="rounded-2xl border border-border bg-card p-4 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="font-display font-black text-foreground">{r.customer_name}</div>
                  <p className="text-[11px] text-muted-foreground">{new Date(r.created_at).toLocaleDateString("en-PK", { year: "numeric", month: "short", day: "numeric" })}</p>
                </div>
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? "fill-current text-[color:var(--neon-green)]" : "text-muted-foreground/30"}`} />
                  ))}
                </div>
              </div>
              <p className="text-sm text-foreground/85 leading-relaxed">{r.comment}</p>
              {r.image_url && (
                <a href={r.image_url} target="_blank" rel="noopener noreferrer" className="inline-block">
                  <img
                    src={r.image_url}
                    alt={`${r.customer_name}'s review photo`}
                    loading="lazy"
                    className="mt-1 h-24 w-24 rounded-lg object-cover border border-border hover:opacity-90"
                  />
                </a>
              )}
            </article>
          ))}
        </div>
      )}

      {!loading && reviews.length > 0 && (
        <p className="mt-3 text-[11px] text-muted-foreground flex items-center gap-1">
          <ImageIcon className="h-3 w-3" /> Photos in reviews are uploaded by real customers.
        </p>
      )}
    </section>
  );
}