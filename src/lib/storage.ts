import { supabase } from "@/integrations/supabase/client";

const BUCKET = "product-images";
const TEN_YEARS = 60 * 60 * 24 * 365 * 10;

/**
 * Uploads an image to the product-images bucket and returns a long-lived URL
 * that can be stored in the database and rendered directly by the storefront.
 */
export async function uploadImage(file: File, path: string): Promise<string> {
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: false, contentType: file.type });
  if (error) throw error;

  const { data, error: signErr } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, TEN_YEARS);
  if (signErr || !data?.signedUrl) {
    // Fall back to the public URL shape — harmless if the bucket is public.
    return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  }
  return data.signedUrl;
}

export function imagePath(prefix: string, file: File) {
  const ext = file.name.split(".").pop() || "png";
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
}
