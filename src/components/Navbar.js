'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [role, setRole] = useState(null)

  useEffect(() => {
    async function getRole() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('profiles').select('role').eq('id', user.id).single()
        setRole(data?.role || 'kasir')
      }
    }
    getRole()
  }, [])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  // Menu dasar untuk semua orang
  const menu = [{ href: '/kasir', label: '🛒 Kasir' }]

  // Menu tambahan khusus admin
  if (role === 'admin') {
    menu.push(
      { href: '/admin/produk', label: '📦 Produk' },
      { href: '/admin/laporan', label: '📊 Laporan' },
      { href: '/admin/pegawai', label: '👥 Pegawai' }
    )
  }

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