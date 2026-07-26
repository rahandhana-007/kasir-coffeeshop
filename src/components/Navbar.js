'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const menu = [
    { href: '/kasir', label: '🛒 Kasir' },
    { href: '/admin/produk', label: '📦 Produk' },
    { href: '/admin/laporan', label: '📊 Laporan' },
  ]

  return (
    <nav className="bg-amber-900 text-white px-6 py-3 flex items-center gap-2">
      <span className="font-bold mr-4">☕ Coffee Shop</span>
      {menu.map((m) => (
        <Link key={m.href} href={m.href}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
            pathname === m.href ? 'bg-amber-700' : 'hover:bg-amber-800'}`}>
          {m.label}
        </Link>
      ))}
      <button onClick={handleLogout}
        className="ml-auto bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-lg text-sm">
        Logout
      </button>
    </nav>
  )
}