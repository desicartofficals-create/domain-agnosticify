import { useEffect, useState, type FormEvent } from "react";
import { Loader2, Minus, Plus, ShoppingBag, Trash2, X, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useCart, onCartOpen } from "@/lib/use-cart";
import { supabase } from "@/integrations/supabase/client";

const DELIVERY_CHARGE = 0;

export function CartDrawer() {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [placed, setPlaced] = useState(false);
  const [details, setDetails] = useState({ name: "", phone: "", city: "", address: "" });
  const { items, setQty, removeItem, subtotal, clear, count } = useCart();

  useEffect(() => onCartOpen(() => setOpen(true)), []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const close = () => {
    setOpen(false);
    setTimeout(() => setPlaced(false), 250);
  };

  const total = subtotal + (items.length > 0 ? DELIVERY_CHARGE : 0);

  const checkout = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!e.currentTarget.reportValidity()) return;
    if (items.length === 0) return;
    setSubmitting(true);

    const rows = items.map((i) => {
      const unit = parseInt(i.price.replace(/[^0-9]/g, ""), 10) || 0;
      const sub = unit * i.qty;
      return {
        product_slug: i.slug,
        product_name: i.name,
        product_color: i.color ?? null,
        unit_price: i.price,
        quantity: i.qty,
        subtotal: sub,
        delivery_charge: 0,
        total: sub,
        customer_name: details.name,
        customer_phone: details.phone,
        customer_city: details.city,
        customer_address: details.address,
        notes: `Cart checkout (${items.length} item${items.length > 1 ? "s" : ""}). Free delivery.`,
      };
    });

    const { error } = await supabase.from("orders").insert(rows);
    setSubmitting(false);

    if (error) {
      toast.error(`Could not place order: ${error.message}`);
      return;
    }
    setPlaced(true);
    clear();
    setDetails({ name: "", phone: "", city: "", address: "" });
    toast.success("Order placed! We'll call you shortly to confirm.");
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={close} />
      <aside className="relative h-full w-full max-w-md bg-background border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-accent" />
            <h2 className="font-display text-xl font-black">Your Cart</h2>
            {count > 0 && <span className="text-xs text-muted-foreground">({count} item{count !== 1 ? "s" : ""})</span>}
          </div>
          <button onClick={close} aria-label="Close" className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {placed ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 gap-3">
            <CheckCircle2 className="h-14 w-14 text-accent" />
            <h3 className="font-display text-2xl font-black">Order received!</h3>
            <p className="text-sm text-muted-foreground">Our team will call you shortly to confirm your delivery.</p>
            <button onClick={close} className="mt-3 rounded-full bg-foreground text-background px-6 py-3 text-sm font-bold">Continue shopping</button>
          </div>
        ) : items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 gap-3">
            <ShoppingBag className="h-14 w-14 text-muted-foreground/40" />
            <h3 className="font-display text-lg font-black">Your cart is empty</h3>
            <p className="text-sm text-muted-foreground">Browse products and tap "Add to Cart".</p>
            <button onClick={close} className="mt-3 rounded-full bg-foreground text-background px-6 py-3 text-sm font-bold">Continue shopping</button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {items.map((i) => {
                const unit = parseInt(i.price.replace(/[^0-9]/g, ""), 10) || 0;
                const line = unit * i.qty;
                return (
                  <div key={`${i.slug}-${i.color ?? ""}`} className="flex gap-3 rounded-2xl border border-border bg-card p-3">
                    <div className="h-20 w-20 shrink-0 rounded-xl bg-secondary overflow-hidden flex items-center justify-center">
                      <img src={i.img} alt={i.name} loading="lazy" decoding="async" className="w-3/4 h-3/4 object-contain" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-display font-bold text-sm leading-tight line-clamp-2">{i.name}</h4>
                        <button onClick={() => removeItem(i.slug, i.color)} aria-label="Remove" className="text-muted-foreground hover:text-destructive shrink-0">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {i.price} each{i.color ? ` · Color: ${i.color}` : ""}
                      </p>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <div className="inline-flex items-center border border-border rounded-full">
                          <button onClick={() => setQty(i.slug, i.qty - 1, i.color)} className="px-2.5 py-1 hover:text-accent" aria-label="Decrease"><Minus className="h-3.5 w-3.5" /></button>
                          <span className="px-2 text-sm font-bold min-w-[2ch] text-center">{i.qty}</span>
                          <button onClick={() => setQty(i.slug, i.qty + 1, i.color)} className="px-2.5 py-1 hover:text-accent" aria-label="Increase"><Plus className="h-3.5 w-3.5" /></button>
                        </div>
                        <span className="font-display font-black text-sm tabular-nums">Rs. {line.toLocaleString("en-PK")}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <form onSubmit={checkout} className="border-t border-border p-4 space-y-3 bg-card/40">
              <div className="grid grid-cols-2 gap-2">
                <input required placeholder="Your name" value={details.name} onChange={(e) => setDetails((d) => ({ ...d, name: e.target.value }))} className="h-10 rounded-full border border-input bg-background px-4 text-sm outline-none focus:border-accent" />
                <input required placeholder="Phone" value={details.phone} onChange={(e) => setDetails((d) => ({ ...d, phone: e.target.value }))} className="h-10 rounded-full border border-input bg-background px-4 text-sm outline-none focus:border-accent" />
                <input required placeholder="City" value={details.city} onChange={(e) => setDetails((d) => ({ ...d, city: e.target.value }))} className="h-10 rounded-full border border-input bg-background px-4 text-sm outline-none focus:border-accent" />
                <input required placeholder="Address" value={details.address} onChange={(e) => setDetails((d) => ({ ...d, address: e.target.value }))} className="h-10 rounded-full border border-input bg-background px-4 text-sm outline-none focus:border-accent" />
              </div>
              <div className="rounded-xl bg-secondary/40 p-3 text-sm space-y-1">
                <div className="flex justify-between text-foreground/80"><span>Subtotal</span><span className="tabular-nums">Rs. {subtotal.toLocaleString("en-PK")}</span></div>
                <div className="flex justify-between text-foreground/80"><span>Delivery</span><span className="tabular-nums font-bold text-[color:var(--neon-green)]">FREE</span></div>
                <div className="flex justify-between font-bold text-foreground border-t border-border pt-1 mt-1"><span>Total</span><span className="tabular-nums">Rs. {total.toLocaleString("en-PK")}</span></div>
              </div>
              <button type="submit" disabled={submitting} className="w-full inline-flex items-center justify-center gap-2 bg-accent text-accent-foreground font-bold uppercase tracking-wider text-sm px-6 py-3.5 rounded-full hover:scale-[1.01] transition-transform disabled:opacity-60 disabled:cursor-not-allowed animate-attention">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingBag className="h-4 w-4" />}
                {submitting ? "Placing order…" : "Checkout — Cash on Delivery"}
              </button>
            </form>
          </>
        )}
      </aside>
    </div>
  );
}