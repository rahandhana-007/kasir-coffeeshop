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
  const [cart, setCart] = useState([]) // ← BARU: state keranjang

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient()
      const { data: cats } = await supabase
        .from('categories').select('*').order('name')
      const { data: prods } = await supabase
        .from('products').select('*, categories(name)')
        .eq('is_active', true).order('name')
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

  // ============ FUNGSI-FUNGSI KERANJANG (BARU) ============

  // Klik menu → tambah ke keranjang
  function addToCart(product) {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id)
      if (existing) {
        // Sudah ada di keranjang → qty +1
        return prev.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        )
      }
      // Belum ada → tambahkan sebagai item baru
      return [...prev, { id: product.id, name: product.name, price: product.price, qty: 1 }]
    })
  }

  // Tombol + dan − : ubah jumlah (kalau jadi 0, hapus dari keranjang)
  function changeQty(productId, delta) {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === productId ? { ...item, qty: item.qty + delta } : item
        )
        .filter((item) => item.qty > 0)
    )
  }

  // Hapus satu item langsung
  function removeItem(productId) {
    setCart((prev) => prev.filter((item) => item.id !== productId))
  }

  // Hitung total
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0)

  const filteredProducts =
    selectedCategory === 'semua'
      ? products
      : products.filter((p) => p.category_id === selectedCategory)

  return (
    <main className="min-h-screen bg-amber-50 flex">
      {/* ==================== KIRI: MENU ==================== */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-amber-900">☕ Kasir Coffee Shop</h1>
          <button onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm">
            Logout
          </button>
        </div>

        {/* Filter kategori */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <button onClick={() => setSelectedCategory('semua')}
            className={`px-4 py-2 rounded-full text-sm font-medium ${
              selectedCategory === 'semua'
                ? 'bg-amber-700 text-white'
                : 'bg-white text-amber-900 border border-amber-300'}`}>
            Semua
          </button>
          {categories.map((cat) => (
            <button key={cat.id} onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                selectedCategory === cat.id
                  ? 'bg-amber-700 text-white'
                  : 'bg-white text-amber-900 border border-amber-300'}`}>
              {cat.name}
            </button>
          ))}
        </div>

        {/* Grid menu */}
        {loading ? (
          <p className="text-amber-700">Memuat menu...</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map((product) => (
              <button key={product.id}
                onClick={() => addToCart(product)}   // ← BARU: klik = masuk keranjang
                className="bg-white rounded-xl shadow p-4 text-left hover:shadow-lg hover:scale-105 transition active:scale-95">
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
      </div>

      {/* ==================== KANAN: KERANJANG ==================== */}
      <div className="w-96 bg-white shadow-xl p-6 flex flex-col">
        <h2 className="text-lg font-bold text-gray-800 mb-4">
          🛒 Pesanan ({cart.reduce((s, i) => s + i.qty, 0)} item)
        </h2>

        {/* Daftar item */}
        <div className="flex-1 overflow-y-auto space-y-3">
          {cart.length === 0 ? (
            <p className="text-gray-400 text-sm text-center mt-10">
              Keranjang kosong.<br />Klik menu untuk menambahkan.
            </p>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="flex items-center gap-2 border-b pb-3">
                <div className="flex-1">
                  <p className="font-medium text-sm text-gray-800">{item.name}</p>
                  <p className="text-xs text-gray-500">
                    Rp {item.price.toLocaleString('id-ID')} × {item.qty} ={' '}
                    <span className="font-semibold text-amber-700">
                      Rp {(item.price * item.qty).toLocaleString('id-ID')}
                    </span>
                  </p>
                </div>
                <button onClick={() => changeQty(item.id, -1)}
                  className="w-7 h-7 rounded-full bg-gray-200 hover:bg-gray-300 font-bold">−</button>
                <span className="w-6 text-center text-sm font-semibold">{item.qty}</span>
                <button onClick={() => changeQty(item.id, 1)}
                  className="w-7 h-7 rounded-full bg-amber-700 text-white hover:bg-amber-800 font-bold">+</button>
                <button onClick={() => removeItem(item.id)}
                  className="ml-1 text-red-400 hover:text-red-600 text-sm">✕</button>
              </div>
            ))
          )}
        </div>

        {/* Total & tombol bayar */}
        <div className="border-t pt-4 mt-4">
          <div className="flex justify-between items-center mb-4">
            <span className="text-gray-600 font-medium">TOTAL</span>
            <span className="text-2xl font-bold text-amber-800">
              Rp {total.toLocaleString('id-ID')}
            </span>
          </div>
          <button
            disabled={cart.length === 0}
            onClick={() => alert('Fitur bayar dibuat di tahap 7.3!')}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white py-3 rounded-xl font-bold text-lg">
            💵 Bayar
          </button>
        </div>
      </div>
    </main>
  )
}