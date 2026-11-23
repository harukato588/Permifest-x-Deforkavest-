/**
 * Memeriksa apakah Supabase URL dan Anon Key sudah terisi konfigurasi asli
 * Aman digunakan baik di Server Component maupun Client Component
 */
export function isSupabaseLive(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return false;
  if (url.includes('placeholder.supabase.co') || anonKey.includes('placeholder-anon-key')) {
    return false;
  }
  return true;
}
