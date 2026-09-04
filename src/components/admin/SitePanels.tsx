import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Loader2, Plus, Save, Trash2, Upload, Megaphone, Images, Share2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSiteSettings, useHeroSlides, SOCIAL_KEYS, type HeroSlide } from "@/lib/use-site";
import { uploadImage, imagePath } from "@/lib/storage";

const input = "h-10 w-full rounded-full border border-input bg-background px-4 text-sm outline-none focus:border-accent";
const card = "rounded-3xl border border-border bg-card p-6 space-y-4";

export function RibbonPanel() {
  const { settings, saveSetting } = useSiteSettings();
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const val = (k: string) => draft[k] ?? settings[k] ?? "";

  const keys = ["ribbon_text", "ribbon_bg", "ribbon_fg", "ribbon_countdown_end", "ribbon_enabled", "urgency_text", "urgency_timer_minutes"];

  const save = async () => {
    setBusy(true);
    try {
      for (const k of keys) {
        const v = draft[k];
        if (v !== undefined && v !== settings[k]) await saveSetting(k, v);
      }
      toast.success("Banner settings saved — live on the store.");
      setDraft({});
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={card}>
      <div className="flex items-center gap-3">
        <Megaphone className="h-6 w-6 text-accent" />
        <div>
          <h2 className="font-display text-2xl font-black">Announcement bar & urgency</h2>
          <p className="text-xs text-muted-foreground">Scrolling top bar, its colours and countdown, plus the product-page urgency text.</p>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="sm:col-span-2 space-y-1">
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Bar text</span>
          <input className={input} value={val("ribbon_text")} onChange={(e) => setDraft({ ...draft, ribbon_text: e.target.value })} />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Background colour</span>
          <input type="color" className="h-10 w-full rounded-full border border-input bg-background px-2" value={val("ribbon_bg") || "#0f9d58"} onChange={(e) => setDraft({ ...draft, ribbon_bg: e.target.value })} />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Text colour</span>
          <input type="color" className="h-10 w-full rounded-full border border-input bg-background px-2" value={val("ribbon_fg") || "#ffffff"} onChange={(e) => setDraft({ ...draft, ribbon_fg: e.target.value })} />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Countdown ends (optional)</span>
          <input type="datetime-local" className={input} value={val("ribbon_countdown_end")} onChange={(e) => setDraft({ ...draft, ribbon_countdown_end: e.target.value })} />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Show the bar</span>
          <select className={input} value={val("ribbon_enabled") || "true"} onChange={(e) => setDraft({ ...draft, ribbon_enabled: e.target.value })}>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </label>
        <label className="sm:col-span-2 space-y-1">
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Product page social proof text</span>
          <input className={input} value={val("urgency_text")} onChange={(e) => setDraft({ ...draft, urgency_text: e.target.value })} />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Sale timer length (minutes)</span>
          <input type="number" className={input} value={val("urgency_timer_minutes")} onChange={(e) => setDraft({ ...draft, urgency_timer_minutes: e.target.value })} />
        </label>
      </div>
      <button onClick={save} disabled={busy} className="rounded-full bg-accent text-accent-foreground px-5 py-2.5 text-sm font-bold inline-flex items-center gap-2 disabled:opacity-50">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
      </button>
    </div>
  );
}

export function SocialLinksPanel() {
  const { settings, saveSetting } = useSiteSettings();
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      for (const k of SOCIAL_KEYS) {
        const key = `social_${k}`;
        const v = draft[key];
        if (v !== undefined && v !== settings[key]) await saveSetting(key, v);
      }
      toast.success("Social links saved.");
      setDraft({});
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={card}>
      <div className="flex items-center gap-3">
        <Share2 className="h-6 w-6 text-accent" />
        <div>
          <h2 className="font-display text-2xl font-black">Social links</h2>
          <p className="text-xs text-muted-foreground">Leave a field empty to hide that icon in the footer.</p>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {SOCIAL_KEYS.map((k) => {
          const key = `social_${k}`;
          return (
            <label key={k} className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{k}</span>
              <input
                className={input}
                placeholder="https://…"
                value={draft[key] ?? settings[key] ?? ""}
                onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
              />
            </label>
          );
        })}
      </div>
      <button onClick={save} disabled={busy} className="rounded-full bg-accent text-accent-foreground px-5 py-2.5 text-sm font-bold inline-flex items-center gap-2 disabled:opacity-50">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
      </button>
    </div>
  );
}

export function HeroSlidesPanel() {
  const slides = useHeroSlides(false);
  const [rows, setRows] = useState<HeroSlide[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [newSlide, setNewSlide] = useState({ title: "", subtitle: "", link_slug: "" });

  useEffect(() => setRows(slides), [slides]);

  const update = (id: string, patch: Partial<HeroSlide>) => setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const save = async (row: HeroSlide) => {
    setBusyId(row.id);
    const { error } = await supabase.from("hero_slides").update({
      title: row.title, subtitle: row.subtitle, badge: row.badge,
      link_slug: row.link_slug, sort_order: row.sort_order, active: row.active, image_url: row.image_url,
    }).eq("id", row.id);
    setBusyId(null);
    if (error) toast.error(error.message);
    else toast.success("Slide saved.");
  };

  const upload = async (row: HeroSlide, file: File) => {
    setBusyId(row.id);
    try {
      const url = await uploadImage(file, imagePath(`hero-${row.id}`, file));
      const { error } = await supabase.from("hero_slides").update({ image_url: url }).eq("id", row.id);
      if (error) throw error;
      update(row.id, { image_url: url });
      toast.success("Slide image updated.");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (row: HeroSlide) => {
    if (!confirm("Delete this slide?")) return;
    const { error } = await supabase.from("hero_slides").delete().eq("id", row.id);
    if (error) toast.error(error.message);
    else toast.success("Slide deleted.");
  };

  const create = async (e: FormEvent) => {
    e.preventDefault();
    const maxSort = rows.reduce((m, r) => Math.max(m, r.sort_order), 0);
    const { error } = await supabase.from("hero_slides").insert({
      title: newSlide.title.trim(),
      subtitle: newSlide.subtitle.trim(),
      link_slug: newSlide.link_slug.trim() || null,
      sort_order: maxSort + 1,
    });
    if (error) toast.error(error.message);
    else {
      toast.success("Slide added.");
      setNewSlide({ title: "", subtitle: "", link_slug: "" });
    }
  };

  return (
    <div className={card}>
      <div className="flex items-center gap-3">
        <Images className="h-6 w-6 text-accent" />
        <div>
          <h2 className="font-display text-2xl font-black">Hero slideshow</h2>
          <p className="text-xs text-muted-foreground">Hand-pick the products shown at the top. The background colour is taken from each photo automatically.</p>
        </div>
      </div>

      <div className="grid gap-3">
        {rows.map((row) => (
          <div key={row.id} className="rounded-2xl border border-border bg-background p-4 flex flex-col sm:flex-row gap-3">
            <div className="relative h-20 w-20 shrink-0 rounded-xl bg-secondary overflow-hidden flex items-center justify-center border border-border">
              {row.image_url ? <img src={row.image_url} alt="" className="w-3/4 h-3/4 object-contain" /> : <span className="text-[10px] text-muted-foreground text-center px-1">Uses product photo</span>}
              <label className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition flex items-center justify-center cursor-pointer text-white text-[10px] font-bold gap-1">
                <Upload className="h-3.5 w-3.5" /> Change
                <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(row, f); e.target.value = ""; }} />
              </label>
            </div>
            <div className="flex-1 grid gap-2 sm:grid-cols-2">
              <input className={input} value={row.title} onChange={(e) => update(row.id, { title: e.target.value })} placeholder="Headline" />
              <input className={input} value={row.subtitle} onChange={(e) => update(row.id, { subtitle: e.target.value })} placeholder="Sub headline" />
              <input className={input} value={row.badge ?? ""} onChange={(e) => update(row.id, { badge: e.target.value })} placeholder="Badge (e.g. Best Seller)" />
              <input className={input} value={row.link_slug ?? ""} onChange={(e) => update(row.id, { link_slug: e.target.value })} placeholder="Product slug to link" />
              <input className={input} type="number" value={row.sort_order} onChange={(e) => update(row.id, { sort_order: Number(e.target.value) || 0 })} placeholder="Order" />
              <select className={input} value={row.active ? "true" : "false"} onChange={(e) => update(row.id, { active: e.target.value === "true" })}>
                <option value="true">Visible</option>
                <option value="false">Hidden</option>
              </select>
            </div>
            <div className="flex sm:flex-col gap-2 shrink-0">
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

      <form onSubmit={create} className="grid gap-2 sm:grid-cols-4 pt-3 border-t border-border">
        <input className={input} placeholder="Headline" value={newSlide.title} onChange={(e) => setNewSlide({ ...newSlide, title: e.target.value })} />
        <input className={input} placeholder="Sub headline" value={newSlide.subtitle} onChange={(e) => setNewSlide({ ...newSlide, subtitle: e.target.value })} />
        <input className={input} placeholder="Product slug" value={newSlide.link_slug} onChange={(e) => setNewSlide({ ...newSlide, link_slug: e.target.value })} />
        <button className="h-10 rounded-full bg-foreground text-background text-xs font-bold inline-flex items-center justify-center gap-1.5">
          <Plus className="h-3.5 w-3.5" /> Add slide
        </button>
      </form>
    </div>
  );
}
