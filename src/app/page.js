'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function Home() {
  const [products, setProducts] = useState([])

  useEffect(() => {
    const supabase = createClient()
    supabase.from('products').select('*').then(({ data }) => {
      setProducts(data || [])
    })
  }, [])

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">Tes Koneksi Supabase</h1>
      <ul className="mt-4">
        {products.map((p) => (
          <li key={p.id}>{p.name} — Rp {p.price.toLocaleString('id-ID')}</li>
        ))}
      </ul>
    </main>
  )
}