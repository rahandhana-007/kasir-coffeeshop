'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function ProdukPage() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  // Form tambah/edit
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)      // null = mode tambah, ada isi = mode edit
  const [formName, setFormName] = useState('')
  const [formPrice, setFormPrice] = useState('')
  const [formCategory, setFormCategory] = useState('')

  async function fetchData() {
    const supabase = createClient()
    const { data: cats } = await supabase
      .from('categories').select('*').order('name')
    const { data: prods } = await supabase
      .from('products').select('*, categories(name)').order('name')
    setCategories(cats || [])
    setProducts(prods || [])
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  // Buka form mode TAMBAH
  function openTambah() {
    setEditId(null)
    setFormName('')
    setFormPrice('')
    setFormCategory(categories[0]?.id || '')
    setShowForm(true)
  }

  // Buka form mode EDIT
  function openEdit(product) {
    setEditId(product.id)
    setFormName(product.name)
    setFormPrice(String(product.price))
    setFormCategory(product.category_id)
    setShowForm(true)
  }

  // Simpan (tambah baru ATAU update)
  async function handleSimpan(e) {
    e.preventDefault()
    const supabase = createClient()
    const data = {
      name: formName,
      price: parseInt(formPrice),
      category_id: formCategory,
    }

    let error
    if (editId) {
      // Mode edit → update
      ;({ error } = await supabase.from('products').update(data).eq('id', editId))
    } else {
      // Mode tambah → insert
      ;({ error } = await supabase.from('products').insert(data))
    }

    if (error) return alert('Gagal menyimpan: ' + error.message)
    setShowForm(false)
    fetchData() // muat ulang daftar
  }

  // Aktifkan / nonaktifkan produk
  async function toggleAktif(product) {
    const supabase = createClient()
    const { error } = await supabase
      .from('products')
      .update({ is_active: !product.is_active })
      .eq('id', product.id)
    if (error) return alert('Gagal: ' + error.message)
    fetchData()
  }

  return (
    <main className="min-h-screen bg-amber-50 p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-amber-900">📦 Manajemen Produk</h1>
        <button onClick={openTambah}
          className="bg-amber-700 hover:bg-amber-800 text-white px-4 py-2 rounded-lg font-semibold">
          + Tambah Produk
        </button>
      </div>

      {loading ? (
        <p className="text-amber-700">Memuat...</p>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-amber-100 text-amber-900">
              <tr>
                <th className="text-left p-3">Nama</th>
                <th className="text-left p-3">Kategori</th>
                <th className="text-right p-3">Harga</th>
                <th className="text-center p-3">Status</th>
                <th className="text-center p-3">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-t hover:bg-amber-50">
                  <td className="p-3 font-medium">{p.name}</td>
                  <td className="p-3 text-gray-500">{p.categories?.name}</td>
                  <td className="p-3 text-right">Rp {p.price.toLocaleString('id-ID')}</td>
                  <td className="p-3 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      p.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                      {p.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="p-3 text-center space-x-2">
                    <button onClick={() => openEdit(p)}
                      className="text-blue-600 hover:underline">Edit</button>
                    <button onClick={() => toggleAktif(p)}
                      className={p.is_active
                        ? 'text-red-500 hover:underline'
                        : 'text-green-600 hover:underline'}>
                      {p.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Dialog form tambah/edit */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <form onSubmit={handleSimpan} className="bg-white rounded-2xl p-6 w-96 shadow-2xl space-y-4">
            <h3 className="text-xl font-bold text-gray-800">
              {editId ? '✏️ Edit Produk' : '➕ Tambah Produk'}
            </h3>

            <div>
              <label className="text-sm font-medium text-gray-600">Nama produk</label>
              <input value={formName} onChange={(e) => setFormName(e.target.value)}
                required placeholder="Contoh: Americano"
                className="w-full border rounded-lg p-2 mt-1" />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600">Kategori</label>
              <select value={formCategory} onChange={(e) => setFormCategory(e.target.value)}
                required className="w-full border rounded-lg p-2 mt-1">
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600">Harga (Rp)</label>
              <input type="number" value={formPrice} onChange={(e) => setFormPrice(e.target.value)}
                required placeholder="Contoh: 20000"
                className="w-full border rounded-lg p-2 mt-1" />
            </div>

            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setShowForm(false)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 rounded-xl py-2 font-semibold">
                Batal
              </button>
              <button type="submit"
                className="flex-1 bg-amber-700 hover:bg-amber-800 text-white rounded-xl py-2 font-semibold">
                Simpan
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  )
}