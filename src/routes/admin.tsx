import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { LogOut, Plus, Save, Trash2, Upload, Loader2, Inbox, Phone, MapPin, Check, Star, MessageSquare, LayoutGrid, Eye } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { fallbackImageBySlug, placeholderImg } from "@/lib/products";
import { useVisitorCount, useTopCountries, useTopPakistanCities } from "@/lib/use-products";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
  head: () => ({ meta: [{ title: "Admin — DesiCart" }] }),
});

type ProductRow = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  price: string;
  old_price: string | null;
  image_url: string | null;
  tag: string | null;
  category: string;
  description: string;
  features: string[];
  sort_order: number;
  images: string[];
  colors: string[];
};

const EMPTY_NEW = {
  slug: "",
  name: "",
  tagline: "",
  price: "",
  old_price: "",
  tag: "",
  category: "General",
  description: "",
  features: "",
};

function AdminPage() {
  const [session, setSession] = useState<unknown>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (!s) {
        setIsAdmin(false);
        setChecking(false);
      } else {
        setTimeout(() => checkAdmin(s.user.id), 0);
      }
    });
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s) checkAdmin(s.user.id);
      else {
        setIsAdmin(false);
        setChecking(false);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const checkAdmin = async (userId: string) => {
    setChecking(true);
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    setIsAdmin(!!data);
    setChecking(false);
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!session) return <AuthScreen />;
  if (!isAdmin) return <NotAdminScreen />;
  return <AdminDashboard />;
}

type CategoryRow = {
  id: string;
  slug: string;
  label: string;
  image_url: string | null;
  link_slug: string;
  sort_order: number;
};

function CategoriesPanel() {
  const [rows, setRows] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [newRow, setNewRow] = useState({ slug: "", label: "", link_slug: "" });

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) toast.error(error.message);
    else setRows((data as CategoryRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const update = (id: string, patch: Partial<CategoryRow>) => {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const save = async (row: CategoryRow) => {
    setBusyId(row.id);
    const { error } = await supabase.from("categories").update({
      slug: row.slug, label: row.label, link_slug: row.link_slug,
      sort_order: row.sort_order, image_url: row.image_url,
    }).eq("id", row.id);
    setBusyId(null);
    if (error) toast.error(error.message);
    else toast.success(`Category "${row.label}" saved.`);
  };

  const uploadIcon = async (rowId: string, file: File) => {
    setBusyId(rowId);
    const ext = file.name.split(".").pop() || "png";
    const path = `category-${rowId}-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("product-images")
      .upload(path, file, { upsert: false, contentType: file.type });
    if (upErr) { toast.error(upErr.message); setBusyId(null); return; }
    const url = supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;
    const { error } = await supabase.from("categories").update({ image_url: url }).eq("id", rowId);
    setBusyId(null);
    if (error) toast.error(error.message);
    else { update(rowId, { image_url: url }); toast.success("Category icon updated."); }
  };

  const remove = async (row: CategoryRow) => {
    if (!confirm(`Delete category "${row.label}"?`)) return;
    const { error } = await supabase.from("categories").delete().eq("id", row.id);
    if (error) toast.error(error.message);
    else { toast.success("Category deleted."); load(); }
  };

  const create = async (e: FormEvent) => {
    e.preventDefault();
    if (!newRow.slug || !newRow.label || !newRow.link_slug) {
      toast.error("Slug, label and link slug are required.");
      return;
    }
    const maxSort = rows.reduce((m, r) => Math.max(m, r.sort_order), 0);
    const { error } = await supabase.from("categories").insert({
      slug: newRow.slug.trim(), label: newRow.label.trim(),
      link_slug: newRow.link_slug.trim(), sort_order: maxSort + 1,
    });
    if (error) toast.error(error.message);
    else { toast.success("Category added."); setNewRow({ slug: "", label: "", link_slug: "" }); load(); }
  };

  return (
    <div className="rounded-3xl border border-border bg-card p-6 space-y-4">
      <div className="flex items-center gap-3">
        <LayoutGrid className="h-6 w-6 text-accent" />
        <div>
          <h2 className="font-display text-2xl font-black">Category icons</h2>
          <p className="text-xs text-muted-foreground">Manage the circular category shortcuts on the homepage.</p>
        </div>
      </div>
      {loading ? (
        <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-accent" /></div>
      ) : (
        <div className="grid gap-3">
          {rows.map((row) => (
            <div key={row.id} className="rounded-2xl border border-border bg-background p-4 flex flex-col sm:flex-row gap-3 items-start">
              <div className="relative h-20 w-20 shrink-0 rounded-full bg-secondary overflow-hidden flex items-center justify-center border border-border">
                {row.image_url ? (
                  <img src={row.image_url} alt={row.label} className="w-3/4 h-3/4 object-contain" />
                ) : (
                  <span className="text-[10px] text-muted-foreground text-center px-2">No icon</span>
                )}
                <label className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition flex items-center justify-center cursor-pointer text-white text-[10px] font-bold gap-1">
                  <Upload className="h-3.5 w-3.5" /> Change
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                    const f = e.target.files?.[0]; if (f) uploadIcon(row.id, f); e.target.value = "";
                  }} />
                </label>
              </div>
              <div className="flex-1 grid gap-2 sm:grid-cols-2 w-full">
                <input value={row.label} onChange={(e) => update(row.id, { label: e.target.value })} placeholder="Label" className="h-10 rounded-full border border-input bg-background px-4 text-sm outline-none focus:border-accent" />
                <input value={row.slug} onChange={(e) => update(row.id, { slug: e.target.value })} placeholder="Slug (unique)" className="h-10 rounded-full border border-input bg-background px-4 text-sm outline-none focus:border-accent" />
                <input value={row.link_slug} onChange={(e) => update(row.id, { link_slug: e.target.value })} placeholder="Links to product slug" className="h-10 rounded-full border border-input bg-background px-4 text-sm outline-none focus:border-accent" />
                <input type="number" value={row.sort_order} onChange={(e) => update(row.id, { sort_order: Number(e.target.value) || 0 })} placeholder="Sort order" className="h-10 rounded-full border border-input bg-background px-4 text-sm outline-none focus:border-accent" />
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                <button onClick={() => save(row)} disabled={busyId === row.id} className="rounded-full bg-accent text-accent-foreground px-4 py-2 text-xs font-bold inline-flex items-center gap-1.5 disabled:opacity-50">
                  {busyId === row.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Save
                </button>
                <button onClick={() => remove(row)} className="rounded-full border border-destructive text-destructive px-4 py-2 text-xs font-bold inline-flex items-center gap-1.5 hover:bg-destructive/10">
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <form onSubmit={create} className="grid gap-2 sm:grid-cols-4 pt-3 border-t border-border">
        <input required placeholder="Label" value={newRow.label} onChange={(e) => setNewRow({ ...newRow, label: e.target.value })} className="h-10 rounded-full border border-input bg-background px-4 text-sm outline-none focus:border-accent" />
        <input required placeholder="Slug (unique)" value={newRow.slug} onChange={(e) => setNewRow({ ...newRow, slug: e.target.value })} className="h-10 rounded-full border border-input bg-background px-4 text-sm outline-none focus:border-accent" />
        <input required placeholder="Links to product slug" value={newRow.link_slug} onChange={(e) => setNewRow({ ...newRow, link_slug: e.target.value })} className="h-10 rounded-full border border-input bg-background px-4 text-sm outline-none focus:border-accent" />
        <button className="h-10 rounded-full bg-foreground text-background text-xs font-bold inline-flex items-center justify-center gap-1.5">
          <Plus className="h-3.5 w-3.5" /> Add category
        </button>
      </form>
    </div>
  );
}

function VisitorStat() {
  const count = useVisitorCount();
  const countries = useTopCountries(8);
  const pkCities = useTopPakistanCities(10);
  const total = countries.reduce((sum, c) => sum + c.count, 0);
  const pkTotal = pkCities.reduce((sum, c) => sum + c.count, 0);
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-3xl border border-border bg-card p-6 flex items-center gap-4">
        <div className="h-14 w-14 rounded-full bg-accent/15 flex items-center justify-center">
          <Eye className="h-7 w-7 text-accent" />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Total visitors</p>
          <p className="font-display text-3xl font-black tabular-nums">
            {count === null ? "—" : count.toLocaleString("en-PK")}
          </p>
          <p className="text-[11px] text-muted-foreground">Counted once per browser session.</p>
        </div>
      </div>
      <div className="rounded-3xl border border-border bg-card p-6">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Top visitor countries</p>
        {countries.length === 0 ? (
          <p className="text-sm text-muted-foreground">No geo data yet.</p>
        ) : (
          <ul className="space-y-2">
            {countries.map((c) => {
              const pct = total > 0 ? Math.round((c.count / total) * 100) : 0;
              return (
                <li key={c.country} className="flex items-center gap-3 text-sm">
                  <span className="w-32 truncate font-semibold text-foreground">{c.country}</span>
                  <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-14 text-right tabular-nums text-muted-foreground">{c.count}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <div className="rounded-3xl border border-border bg-card p-6 md:col-span-2">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Top Pakistan cities</p>
        {pkCities.length === 0 ? (
          <p className="text-sm text-muted-foreground">No city data from Pakistan yet.</p>
        ) : (
          <ul className="space-y-2">
            {pkCities.map((c) => {
              const pct = pkTotal > 0 ? Math.round((c.count / pkTotal) * 100) : 0;
              return (
                <li key={c.city} className="flex items-center gap-3 text-sm">
                  <span className="w-32 truncate font-semibold text-foreground">{c.city}</span>
                  <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-14 text-right tabular-nums text-muted-foreground">{c.count}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

type OrderRow = {
  id: string;
  product_slug: string;
  product_name: string;
  product_color: string | null;
  unit_price: string;
  quantity: number;
  subtotal: number | null;
  delivery_charge: number;
  total: number | null;
  customer_name: string;
  customer_phone: string;
  customer_city: string;
  customer_address: string;
  status: string;
  notes: string | null;
  created_at: string;
};

function OrdersPanel() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setOrders((data as OrderRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("orders-admin")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  const setStatus = async (id: string, status: string) => {
    setBusyId(id);
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    setBusyId(null);
    if (error) toast.error(error.message);
    else toast.success(`Marked as ${status}.`);
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this order?")) return;
    const { error } = await supabase.from("orders").delete().eq("id", id);
    if (error) toast.error(error.message);
    else toast.success("Order deleted.");
  };

  const newCount = orders.filter((o) => o.status === "new").length;

  return (
    <div className="rounded-3xl border border-border bg-card p-6 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Inbox className="h-6 w-6 text-accent" />
          <div>
            <h2 className="font-display text-2xl font-black">Orders</h2>
            <p className="text-xs text-muted-foreground">
              {newCount > 0 ? `${newCount} new` : "No new orders"} · {orders.length} total
            </p>
          </div>
        </div>
        <button
          onClick={load}
          className="rounded-full border border-border px-4 py-2 text-xs font-semibold hover:bg-secondary"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-accent" /></div>
      ) : orders.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No orders yet. They'll appear here instantly.</p>
      ) : (
        <div className="grid gap-3">
          {orders.map((o) => {
            const isNew = o.status === "new";
            const totalLabel = o.total !== null ? `Rs. ${o.total.toLocaleString("en-PK")}` : o.unit_price;
            return (
              <div
                key={o.id}
                className={`rounded-2xl border p-4 space-y-3 ${isNew ? "border-accent/60 bg-accent/5" : "border-border bg-background"}`}
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full ${
                        isNew ? "bg-accent text-accent-foreground"
                        : o.status === "confirmed" ? "bg-blue-500/20 text-blue-600"
                        : o.status === "delivered" ? "bg-green-500/20 text-green-700"
                        : "bg-muted text-muted-foreground"
                      }`}>{o.status}</span>
                      <span className="font-display font-black text-base">{o.product_name}</span>
                      <span className="text-xs text-muted-foreground">× {o.quantity}</span>
                      {o.product_color && (
                        <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-secondary text-foreground border border-border">
                          Color: {o.product_color}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {new Date(o.created_at).toLocaleString("en-PK")}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="font-display text-xl font-black tabular-nums">{totalLabel}</div>
                    <div className="text-[11px] text-muted-foreground">incl. Rs. {o.delivery_charge} delivery</div>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-2 text-sm">
                  <div className="space-y-1">
                    <div className="font-bold text-foreground">{o.customer_name}</div>
                    <a href={`tel:${o.customer_phone}`} className="inline-flex items-center gap-1.5 text-foreground/80 hover:text-accent">
                      <Phone className="h-3.5 w-3.5" /> {o.customer_phone}
                    </a>
                  </div>
                  <div className="flex items-start gap-1.5 text-foreground/80">
                    <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    <span>{o.customer_address}, {o.customer_city}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 justify-end pt-2 border-t border-border">
                  {isNew && (
                    <button
                      onClick={() => setStatus(o.id, "confirmed")}
                      disabled={busyId === o.id}
                      className="rounded-full bg-foreground text-background px-4 py-1.5 text-xs font-bold inline-flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <Check className="h-3.5 w-3.5" /> Mark confirmed
                    </button>
                  )}
                  {o.status === "confirmed" && (
                    <button
                      onClick={() => setStatus(o.id, "delivered")}
                      disabled={busyId === o.id}
                      className="rounded-full bg-foreground text-background px-4 py-1.5 text-xs font-bold inline-flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <Check className="h-3.5 w-3.5" /> Mark delivered
                    </button>
                  )}
                  <a
                    href={`https://wa.me/${o.customer_phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Hi ${o.customer_name}, this is DesiCart confirming your order for ${o.product_name}.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-border px-4 py-1.5 text-xs font-bold hover:bg-secondary"
                  >
                    WhatsApp customer
                  </a>
                  <button
                    onClick={() => remove(o.id)}
                    className="rounded-full border border-destructive text-destructive px-4 py-1.5 text-xs font-bold inline-flex items-center gap-1.5 hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AuthScreen() {
  return <AuthScreenInner />;
}

type ReviewRow = {
  id: string;
  product_slug: string;
  customer_name: string;
  rating: number;
  comment: string | null;
  image_url: string | null;
  created_at: string;
};

function ReviewsPanel() {
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setReviews((data as ReviewRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel("reviews-admin")
      .on("postgres_changes", { event: "*", schema: "public", table: "reviews" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const remove = async (id: string) => {
    if (!confirm("Delete this review? This cannot be undone.")) return;
    setBusyId(id);
    const { error } = await supabase.from("reviews").delete().eq("id", id);
    setBusyId(null);
    if (error) toast.error(error.message);
    else {
      toast.success("Review deleted.");
      setReviews((rs) => rs.filter((r) => r.id !== id));
    }
  };

  return (
    <div className="rounded-3xl border border-border bg-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl font-black flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-accent" /> Customer reviews ({reviews.length})
        </h2>
        <button onClick={load} className="text-xs font-semibold text-muted-foreground hover:text-accent">Refresh</button>
      </div>
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground">No reviews yet.</p>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="rounded-2xl border border-border bg-background p-4 flex gap-3 items-start">
              {r.image_url && (
                <img src={r.image_url} loading="lazy" alt="" className="h-16 w-16 rounded-lg object-cover shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap text-sm">
                  <span className="font-bold">{r.customer_name}</span>
                  <span className="text-xs text-muted-foreground">on {r.product_slug}</span>
                  <span className="inline-flex items-center gap-0.5 text-xs">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`h-3 w-3 ${i < r.rating ? "fill-current text-accent" : "text-muted-foreground/30"}`} />
                    ))}
                  </span>
                  <span className="text-xs text-muted-foreground ml-auto">{new Date(r.created_at).toLocaleDateString()}</span>
                </div>
                {r.comment && <p className="text-sm text-foreground/80 mt-1 whitespace-pre-wrap break-words">{r.comment}</p>}
              </div>
              <button
                onClick={() => remove(r.id)}
                disabled={busyId === r.id}
                className="rounded-full border border-destructive text-destructive px-3 py-1.5 text-xs font-bold inline-flex items-center gap-1.5 hover:bg-destructive/10 disabled:opacity-50 shrink-0"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AuthScreenInner() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || password.length < 6) {
      toast.error("Enter a valid email and password (6+ chars).");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success("Signed in.");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground px-4">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 space-y-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-accent">DesiCart</p>
          <h1 className="font-display text-3xl font-black">Admin Panel</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in with your admin credentials to manage products.
          </p>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            autoComplete="email"
            className="h-12 w-full rounded-full border border-input bg-background px-5 text-sm outline-none focus:border-accent"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoComplete="current-password"
            className="h-12 w-full rounded-full border border-input bg-background px-5 text-sm outline-none focus:border-accent"
          />
          <button
            type="submit"
            disabled={busy}
            className="h-12 w-full rounded-full bg-foreground text-background font-bold text-sm disabled:opacity-50 inline-flex items-center justify-center gap-2"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Sign in
          </button>
        </form>
        <Link to="/" className="block text-center text-xs text-muted-foreground hover:text-foreground">
          ← Back to store
        </Link>
      </div>
    </div>
  );
}

function NotAdminScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground px-4">
      <div className="max-w-md text-center space-y-4 rounded-3xl border border-border bg-card p-8">
        <h1 className="font-display text-2xl font-black">Not authorized</h1>
        <p className="text-sm text-muted-foreground">This account is not an admin. Sign in with the admin account.</p>
        <button
          onClick={() => supabase.auth.signOut()}
          className="rounded-full bg-foreground text-background px-5 py-2.5 text-sm font-bold"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}

function AdminDashboard() {
  const [rows, setRows] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [newProduct, setNewProduct] = useState(EMPTY_NEW);
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) toast.error(error.message);
    else setRows((data as ProductRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const update = (id: string, patch: Partial<ProductRow>) => {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const save = async (row: ProductRow) => {
    setSavingId(row.id);
    const { error } = await supabase
      .from("products")
      .update({
        slug: row.slug,
        name: row.name,
        tagline: row.tagline,
        price: row.price,
        old_price: row.old_price || null,
        image_url: row.image_url,
        tag: row.tag || null,
        category: row.category,
        description: row.description,
        features: row.features,
        sort_order: row.sort_order,
        images: row.images ?? [],
        colors: row.colors ?? [],
      })
      .eq("id", row.id);
    setSavingId(null);
    if (error) toast.error(error.message);
    else toast.success(`Saved "${row.name}" — live on the website.`);
  };

  const remove = async (row: ProductRow) => {
    if (!confirm(`Delete "${row.name}"? This cannot be undone.`)) return;
    const { error } = await supabase.from("products").delete().eq("id", row.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Product deleted.");
      load();
    }
  };

  const uploadImage = async (rowId: string, file: File) => {
    setSavingId(rowId);
    const ext = file.name.split(".").pop() || "png";
    const path = `${rowId}-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("product-images")
      .upload(path, file, { upsert: false, contentType: file.type });
    if (upErr) {
      toast.error(upErr.message);
      setSavingId(null);
      return;
    }
    const { data: pub } = supabase.storage.from("product-images").getPublicUrl(path);
    const url = pub.publicUrl;
    const { error } = await supabase.from("products").update({ image_url: url }).eq("id", rowId);
    setSavingId(null);
    if (error) toast.error(error.message);
    else {
      update(rowId, { image_url: url });
      toast.success("Image updated.");
    }
  };

  const uploadExtraImages = async (rowId: string, files: FileList) => {
    setSavingId(rowId);
    const urls: string[] = [];
    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop() || "png";
      const path = `${rowId}-extra-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("product-images")
        .upload(path, file, { upsert: false, contentType: file.type });
      if (upErr) {
        toast.error(upErr.message);
        continue;
      }
      urls.push(supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl);
    }
    if (urls.length === 0) {
      setSavingId(null);
      return;
    }
    const row = rows.find((r) => r.id === rowId);
    const nextImages = [...(row?.images ?? []), ...urls];
    const { error } = await supabase.from("products").update({ images: nextImages }).eq("id", rowId);
    setSavingId(null);
    if (error) toast.error(error.message);
    else {
      update(rowId, { images: nextImages });
      toast.success(`${urls.length} photo${urls.length !== 1 ? "s" : ""} added.`);
    }
  };

  const removeExtraImage = (rowId: string, url: string) => {
    const row = rows.find((r) => r.id === rowId);
    if (!row) return;
    update(rowId, { images: (row.images ?? []).filter((u) => u !== url) });
  };

  const createNew = async (e: FormEvent) => {
    e.preventDefault();
    if (!newProduct.slug || !newProduct.name || !newProduct.price) {
      toast.error("Slug, name and price are required.");
      return;
    }
    setCreating(true);
    const features = newProduct.features
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    const maxSort = rows.reduce((m, r) => Math.max(m, r.sort_order), 0);
    const { error } = await supabase.from("products").insert({
      slug: newProduct.slug.trim(),
      name: newProduct.name.trim(),
      tagline: newProduct.tagline.trim(),
      price: newProduct.price.trim(),
      old_price: newProduct.old_price.trim() || null,
      tag: newProduct.tag.trim() || null,
      category: newProduct.category.trim() || "General",
      description: newProduct.description.trim(),
      features,
      sort_order: maxSort + 1,
    });
    setCreating(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Product added — live on the website.");
      setNewProduct(EMPTY_NEW);
      load();
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground px-4 py-8">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-3xl border border-border bg-card p-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-accent">Admin Panel</p>
            <h1 className="font-display text-3xl font-black">DesiCart Products</h1>
            <p className="text-sm text-muted-foreground mt-1">All changes go live instantly for every visitor.</p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/" className="rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-secondary">
              View store
            </Link>
            <button
              onClick={() => supabase.auth.signOut()}
              className="rounded-full bg-foreground text-background px-4 py-2 text-sm font-bold inline-flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </div>

        {/* Visitor analytics */}
        <VisitorStat />

        {/* Category icons */}
        <CategoriesPanel />

        {/* Orders */}
        <OrdersPanel />

        {/* Reviews */}
        <ReviewsPanel />

        {/* Add new product */}
        <details className="rounded-3xl border border-border bg-card p-6">
          <summary className="cursor-pointer font-display text-xl font-black flex items-center gap-2">
            <Plus className="h-5 w-5 text-accent" /> Add new product
          </summary>
          <form onSubmit={createNew} className="mt-5 grid gap-3 sm:grid-cols-2">
            <input required placeholder="URL slug (e.g. my-cool-watch)" value={newProduct.slug} onChange={(e) => setNewProduct({ ...newProduct, slug: e.target.value })} className="h-11 rounded-full border border-input bg-background px-4 text-sm outline-none focus:border-accent" />
            <input required placeholder="Product name" value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} className="h-11 rounded-full border border-input bg-background px-4 text-sm outline-none focus:border-accent" />
            <input required placeholder="Price (e.g. Rs. 1,999)" value={newProduct.price} onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })} className="h-11 rounded-full border border-input bg-background px-4 text-sm outline-none focus:border-accent" />
            <input placeholder="Old price (optional)" value={newProduct.old_price} onChange={(e) => setNewProduct({ ...newProduct, old_price: e.target.value })} className="h-11 rounded-full border border-input bg-background px-4 text-sm outline-none focus:border-accent" />
            <input placeholder="Tag (e.g. Best Seller)" value={newProduct.tag} onChange={(e) => setNewProduct({ ...newProduct, tag: e.target.value })} className="h-11 rounded-full border border-input bg-background px-4 text-sm outline-none focus:border-accent" />
            <input placeholder="Category" value={newProduct.category} onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })} className="h-11 rounded-full border border-input bg-background px-4 text-sm outline-none focus:border-accent" />
            <input placeholder="Tagline" value={newProduct.tagline} onChange={(e) => setNewProduct({ ...newProduct, tagline: e.target.value })} className="h-11 sm:col-span-2 rounded-full border border-input bg-background px-4 text-sm outline-none focus:border-accent" />
            <textarea placeholder="Description" value={newProduct.description} onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })} className="sm:col-span-2 min-h-20 rounded-2xl border border-input bg-background p-3 text-sm outline-none focus:border-accent" />
            <textarea placeholder="Features (one per line)" value={newProduct.features} onChange={(e) => setNewProduct({ ...newProduct, features: e.target.value })} className="sm:col-span-2 min-h-24 rounded-2xl border border-input bg-background p-3 text-sm outline-none focus:border-accent" />
            <button disabled={creating} className="sm:col-span-2 h-11 rounded-full bg-accent text-accent-foreground font-bold text-sm inline-flex items-center justify-center gap-2 disabled:opacity-50">
              {creating && <Loader2 className="h-4 w-4 animate-spin" />}
              <Plus className="h-4 w-4" /> Create product
            </button>
            <p className="sm:col-span-2 text-xs text-muted-foreground">After creating, scroll down and use the image upload button on the new product card to add a photo.</p>
          </form>
        </details>

        {/* Product list */}
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div>
        ) : (
          <div className="grid gap-4">
            {rows.map((row) => {
              const previewImg = row.image_url || fallbackImageBySlug[row.slug] || placeholderImg;
              return (
                <div key={row.id} className="rounded-3xl border border-border bg-card p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative w-32 h-32 shrink-0 rounded-2xl bg-secondary overflow-hidden flex items-center justify-center">
                      <img src={previewImg} alt={row.name} className="w-3/4 h-3/4 object-contain" />
                      <label className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition flex items-center justify-center cursor-pointer text-white text-xs font-bold gap-1">
                        <Upload className="h-4 w-4" /> Change
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) uploadImage(row.id, f);
                            e.target.value = "";
                          }}
                        />
                      </label>
                    </div>
                    <div className="flex-1 grid gap-3 sm:grid-cols-2">
                      <p className="sm:col-span-2 text-[11px] text-muted-foreground -mt-1">Main image — recommended 1:1 square (800×800 or 1000×1000) on a clean white background.</p>
                      <input value={row.name} onChange={(e) => update(row.id, { name: e.target.value })} placeholder="Name" className="h-11 rounded-full border border-input bg-background px-4 text-sm outline-none focus:border-accent" />
                      <input value={row.slug} onChange={(e) => update(row.id, { slug: e.target.value })} placeholder="URL slug" className="h-11 rounded-full border border-input bg-background px-4 text-sm outline-none focus:border-accent" />
                      <input value={row.price} onChange={(e) => update(row.id, { price: e.target.value })} placeholder="Price" className="h-11 rounded-full border border-input bg-background px-4 text-sm outline-none focus:border-accent" />
                      <input value={row.old_price ?? ""} onChange={(e) => update(row.id, { old_price: e.target.value })} placeholder="Old price" className="h-11 rounded-full border border-input bg-background px-4 text-sm outline-none focus:border-accent" />
                      <input value={row.tag ?? ""} onChange={(e) => update(row.id, { tag: e.target.value })} placeholder="Tag" className="h-11 rounded-full border border-input bg-background px-4 text-sm outline-none focus:border-accent" />
                      <input value={row.category} onChange={(e) => update(row.id, { category: e.target.value })} placeholder="Category" className="h-11 rounded-full border border-input bg-background px-4 text-sm outline-none focus:border-accent" />
                      <input value={row.tagline} onChange={(e) => update(row.id, { tagline: e.target.value })} placeholder="Tagline" className="h-11 sm:col-span-2 rounded-full border border-input bg-background px-4 text-sm outline-none focus:border-accent" />
                      <input type="number" value={row.sort_order} onChange={(e) => update(row.id, { sort_order: Number(e.target.value) || 0 })} placeholder="Sort order" className="h-11 rounded-full border border-input bg-background px-4 text-sm outline-none focus:border-accent" />
                    </div>
                  </div>
                  <textarea value={row.description} onChange={(e) => update(row.id, { description: e.target.value })} placeholder="Description" className="w-full min-h-20 rounded-2xl border border-input bg-background p-3 text-sm outline-none focus:border-accent" />
                  <textarea
                    value={row.features.join("\n")}
                    onChange={(e) => update(row.id, { features: e.target.value.split("\n").map((s) => s).filter((s, i, arr) => s.trim() !== "" || i === arr.length - 1) })}
                    placeholder="Features (one per line)"
                    className="w-full min-h-24 rounded-2xl border border-input bg-background p-3 text-sm outline-none focus:border-accent"
                  />
                  {/* Colors */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Colors (comma separated — names or hex like #ff0000)</label>
                    <input
                      value={(row.colors ?? []).join(", ")}
                      onChange={(e) => update(row.id, { colors: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
                      placeholder="Black, White, #ff5733"
                      className="h-11 w-full rounded-full border border-input bg-background px-4 text-sm outline-none focus:border-accent"
                    />
                  </div>
                  {/* Extra images gallery */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Additional photos ({(row.images ?? []).length})</label>
                      <label className="cursor-pointer inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-bold hover:bg-secondary">
                        <Upload className="h-3.5 w-3.5" /> Add photos
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files.length > 0) uploadExtraImages(row.id, e.target.files);
                            e.target.value = "";
                          }}
                        />
                      </label>
                    </div>
                    <p className="text-[11px] text-muted-foreground">Recommended: 1:1 square, 800×800px or 1000×1000px (PNG/JPG, under 500KB) on a clean white background for edge-to-edge fit.</p>
                    {(row.images ?? []).length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {row.images!.map((u) => (
                          <div key={u} className="relative h-16 w-16 rounded-lg overflow-hidden bg-secondary border border-border">
                            <img src={u} alt="" loading="lazy" className="w-full h-full object-contain" />
                            <button
                              type="button"
                              onClick={() => removeExtraImage(row.id, u)}
                              aria-label="Remove"
                              className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-white flex items-center justify-center text-xs"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                        <p className="w-full text-[11px] text-muted-foreground">Click "Save changes" to persist removals.</p>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 justify-end">
                    <button
                      onClick={() => remove(row)}
                      className="rounded-full border border-destructive text-destructive px-4 py-2 text-sm font-bold inline-flex items-center gap-2 hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" /> Delete
                    </button>
                    <button
                      onClick={() => save(row)}
                      disabled={savingId === row.id}
                      className="rounded-full bg-accent text-accent-foreground px-5 py-2 text-sm font-bold inline-flex items-center gap-2 disabled:opacity-50"
                    >
                      {savingId === row.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Save changes
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}