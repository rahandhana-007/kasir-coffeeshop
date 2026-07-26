import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL=https://qpdogonbygaxkconbqbh.supabase.co,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_0RvDC63DrrQlyR1d5dub_w_s7RFJwH2
  )
}