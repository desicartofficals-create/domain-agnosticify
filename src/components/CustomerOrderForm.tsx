import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { CheckCircle2, Loader2, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import type { Product } from "@/lib/products";
import { supabase } from "@/integrations/supabase/client";
import { openCart, useCart } from "@/lib/use-cart";
import { trackTikTokEvent } from "@/utils/tiktokPixel";
import { trackMetaClick, trackMetaEvent } from "@/utils/metaPixel";

type CustomerOrderFormProps = {
  product: Product;
  selectedColor?: string;
};

export function CustomerOrderForm({ product, selectedColor }: CustomerOrderFormProps) {
  const [qty, setQty] = useState(1);
  const [details, setDetails] = useState({ name: "", phone: "", city: "", address: "" });
  const [submitting, setSubmitting] = useState(false);
  const [placed, setPlaced] = useState(false);
  const { addItem } = useCart();

  const handleAddToCart = () => {
    addItem({ slug: product.slug, name: product.name, price: product.price, img: product.img }, qty, selectedColor);
    toast.success(`${qty} × ${product.name}${selectedColor ? ` (${selectedColor})` : ""} added to cart`);
    trackTikTokEvent("AddToCart", {
      content_type: "product",
      content_id: product.slug,
      content_name: product.name,
      content_category: product.category,
      quantity: qty,
      value: subtotal ?? 0,
      currency: "PKR",
    });
    trackMetaEvent("AddToCart", {
      value: subtotal ?? 0,
      currency: "PKR",
      content_ids: [product.slug],
      content_name: product.name,
      content_type: "product",
    });
    trackMetaClick("add_to_cart", { product: product.slug });
    openCart();
  };

  const DELIVERY_CHARGE = 0;

  const unitPrice = useMemo(() => {
    const num = parseInt(product.price.replace(/[^0-9]/g, ""), 10);
    return isNaN(num) ? null : num;
  }, [product.price]);

  const subtotal = unitPrice !== null ? unitPrice * qty : null;
  const grandTotal = subtotal !== null ? subtotal + DELIVERY_CHARGE : null;
  const subtotalLabel = subtotal !== null ? `Rs. ${subtotal.toLocaleString("en-PK")}` : product.price;
  const totalPrice = grandTotal !== null ? `Rs. ${grandTotal.toLocaleString("en-PK")}` : product.price;

  const submitOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    setSubmitting(true);
    const { error } = await supabase.from("orders").insert({
      product_slug: product.slug,
      product_name: product.name,
      product_color: selectedColor ?? null,
      unit_price: product.price,
      quantity: qty,
      subtotal: subtotal,
      delivery_charge: DELIVERY_CHARGE,
      total: grandTotal,
      customer_name: details.name,
      customer_phone: details.phone,
      customer_city: details.city,
      customer_address: details.address,
    });
    setSubmitting(false);
    if (error) {
      toast.error(`Could not place order: ${error.message}`);
      return;
    }
    setPlaced(true);
    trackTikTokEvent("PlaceAnOrder", {
      content_type: "product",
      content_id: product.slug,
      content_name: product.name,
      content_category: product.category,
      quantity: qty,
      value: grandTotal ?? 0,
      currency: "PKR",
    });
    trackMetaEvent("Purchase", {
      value: grandTotal ?? 0,
      currency: "PKR",
      content_type: "product",
      content_ids: [product.slug],
      content_name: product.name,
      num_items: qty,
    });
    toast.success("Order placed! We'll call you shortly to confirm.");
    setDetails({ name: "", phone: "", city: "", address: "" });
    setQty(1);
  };

  if (placed) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-center space-y-3">
        <CheckCircle2 className="h-12 w-12 text-accent mx-auto" />
        <h3 className="font-display text-xl font-black text-foreground">Order received!</h3>
        <p className="text-sm text-muted-foreground">
          Thanks for your order. Our team will call you shortly to confirm delivery details.
        </p>
        <button
          type="button"
          onClick={() => setPlaced(false)}
          className="mt-2 inline-flex items-center justify-center rounded-full border-2 border-foreground text-foreground font-bold text-xs uppercase tracking-wider px-5 py-2.5 hover:bg-foreground hover:text-background transition-colors"
        >
          Place another order
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submitOrder} className="space-y-4 rounded-2xl border border-border bg-card p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <span className="text-sm font-semibold text-foreground">Quantity</span>
          <p className="text-xs text-muted-foreground mt-0.5">
            {qty} × {product.price}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-display text-xl font-black text-foreground tabular-nums">
            {totalPrice}
          </span>
          <div className="inline-flex items-center border border-border rounded-full">
            <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-4 py-2 text-foreground hover:text-accent" aria-label="Decrease">−</button>
            <span className="px-4 font-bold text-foreground min-w-[2ch] text-center">{qty}</span>
            <button type="button" onClick={() => setQty((q) => q + 1)} className="px-4 py-2 text-foreground hover:text-accent" aria-label="Increase">+</button>
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-secondary/40 p-3 text-sm space-y-1">
        <div className="flex justify-between text-foreground/80"><span>Subtotal</span><span className="tabular-nums">{subtotalLabel}</span></div>
        <div className="flex justify-between text-foreground/80"><span>Delivery charges</span><span className="tabular-nums font-bold text-[color:var(--neon-green)]">FREE</span></div>
        <div className="flex justify-between font-bold text-foreground border-t border-border pt-1 mt-1"><span>Total</span><span className="tabular-nums">{totalPrice}</span></div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input required aria-label="Customer name" placeholder="Your name" value={details.name} onChange={(e) => setDetails((d) => ({ ...d, name: e.target.value }))} className="h-11 rounded-full border border-input bg-background px-4 text-sm text-foreground outline-none focus:border-accent" />
        <input required aria-label="Customer phone" placeholder="Phone number" value={details.phone} onChange={(e) => setDetails((d) => ({ ...d, phone: e.target.value }))} className="h-11 rounded-full border border-input bg-background px-4 text-sm text-foreground outline-none focus:border-accent" />
        <input required aria-label="Customer city" placeholder="City" value={details.city} onChange={(e) => setDetails((d) => ({ ...d, city: e.target.value }))} className="h-11 rounded-full border border-input bg-background px-4 text-sm text-foreground outline-none focus:border-accent" />
        <input required aria-label="Customer address" placeholder="Delivery address" value={details.address} onChange={(e) => setDetails((d) => ({ ...d, address: e.target.value }))} className="h-11 rounded-full border border-input bg-background px-4 text-sm text-foreground outline-none focus:border-accent" />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-1">
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 inline-flex items-center justify-center gap-2 bg-accent text-accent-foreground font-bold uppercase tracking-wider text-sm px-6 py-4 rounded-full hover:scale-[1.02] transition-transform disabled:opacity-60 disabled:cursor-not-allowed animate-attention shadow-glow"
        >
          {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShoppingCart className="h-5 w-5" />}
          {submitting ? "Placing order…" : "Place Order — Cash on Delivery"}
        </button>
        <button
          type="button"
          onClick={handleAddToCart}
          className="flex-1 inline-flex items-center justify-center gap-2 border-2 border-foreground text-foreground font-bold uppercase tracking-wider text-sm px-6 py-4 rounded-full hover:bg-foreground hover:text-background transition-colors"
        >
          <ShoppingCart className="h-5 w-5" /> Add to Cart
        </button>
      </div>
      <p className="text-[11px] text-muted-foreground text-center">
        Your order goes straight to DesiCart. We'll call to confirm before dispatch.
      </p>
    </form>
  );
}