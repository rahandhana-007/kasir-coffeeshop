'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function KasirPage() {
  const router = useRouter()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('semua')
  const [loading, setLoading] = useState(true)

  // Ambil data menu & kategori saat halaman dibuka
  useEffect(() => {
    async function fetchData() {
      const supabase = createClient()

      const { data: cats } = await supabase
        .from('categories')
        .select('*')
        .order('name')

      const { data: prods } = await supabase
        .from('products')
        .select('*, categories(name)')
        .eq('is_active', true)
        .order('name')

      setCategories(cats || [])
      setProducts(prods || [])
      setLoading(false)
    }
    fetchData()
  }, [])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  // Saring produk sesuai kategori yang dipilih
  const filteredProducts =
    selectedCategory === 'semua'
      ? products
      : products.filter((p) => p.category_id === selectedCategory)

  return (
    <main className="min-h-screen bg-amber-50 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-amber-900">☕ Kasir Coffee Shop</h1>
        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm"
        >
          Logout
        </button>
      </div>

      {/* Tombol filter kategori */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button
          onClick={() => setSelectedCategory('semua')}
          className={`px-4 py-2 rounded-full text-sm font-medium ${
            selectedCategory === 'semua'
              ? 'bg-amber-700 text-white'
              : 'bg-white text-amber-900 border border-amber-300'
          }`}
        >
          Semua
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium ${
              selectedCategory === cat.id
                ? 'bg-amber-700 text-white'
                : 'bg-white text-amber-900 border border-amber-300'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Grid kartu menu */}
      {loading ? (
        <p className="text-amber-700">Memuat menu...</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredProducts.map((product) => (
            <button
              key={product.id}
              className="bg-white rounded-xl shadow p-4 text-left hover:shadow-lg hover:scale-105 transition"
            >
              <div className="text-4xl mb-2">☕</div>
              <p className="font-semibold text-gray-800">{product.name}</p>
              <p className="text-xs text-gray-400">{product.categories?.name}</p>
              <p className="text-amber-700 font-bold mt-1">
                Rp {product.price.toLocaleString('id-ID')}
              </p>
            </button>
          ))}
        </div>
      )}
    </main>
  )
}