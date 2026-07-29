import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function middleware(request) {
  // Siapkan response awal
  let response = NextResponse.next({ request })

  // Buat client Supabase khusus middleware (membaca session dari cookie)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Cek siapa yang sedang login (juga me-refresh session yang hampir kedaluwarsa)
  const { data: { user } } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  // Daftar halaman yang WAJIB login
  const halamanTerproteksi =
    path.startsWith('/kasir') || path.startsWith('/admin')

  // Belum login tapi mau buka halaman terproteksi → usir ke /login
  if (!user && halamanTerproteksi) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Sudah login, tapi bukan admin, mau buka /admin → usir ke /kasir
  if (user && path.startsWith('/admin')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/kasir'
      return NextResponse.redirect(url)
    }
  }


  // Sudah login tapi buka /login → langsung antar ke /kasir
  if (user && path === '/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/kasir'
    return NextResponse.redirect(url)
  }

  return response
}

// Tentukan halaman mana saja yang dilewati satpam ini
export const config = {
  matcher: ['/kasir/:path*', '/admin/:path*', '/login', '/login-pegawai']
}