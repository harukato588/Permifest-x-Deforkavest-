import 'server-only';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Pastikan admin client tidak pernah berjalan di sisi klien (browser)
if (typeof window !== 'undefined') {
  throw new Error('Supabase admin client can only be used on the server.');
}

let adminClientInstance: SupabaseClient | null = null;

/**
 * Supabase Admin Client dengan wewenang Service Role (Bypass RLS).
 * HANYA boleh dipanggil di lingkungan server (Server Actions, Route Handlers, SSR).
 * JANGAN PERNAH mengekspos client ini atau kuncinya ke browser/client-side!
 */
export function createAdminClient(): SupabaseClient {
  if (adminClientInstance) {
    return adminClientInstance;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    // Mode demo / fallback jika service role belum diisi di .env.local
    console.warn(
      ''
    );
  }

  adminClientInstance = createClient(
    supabaseUrl,
    serviceRoleKey || 'placeholder-service-role-key',
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  return adminClientInstance;
}
