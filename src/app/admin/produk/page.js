'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

export default function ProdukPage() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  // Filter & pencarian
  const [search, setSearch] = useState('')
  const [filterKategori, setFilterKategori] = useState('semua')
  const [filterStatus, setFilterStatus] = useState('semua')

  // Form produk
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)
  const [formName, setFormName] = useState('')
  const [formPrice, setFormPrice] = useState('')
  const [formCategory, setFormCategory] = useState('')

  // Form kategori baru
  const [showKategori, setShowKategori] = useState(false)
  const [namaKategoriBaru, setNamaKategoriBaru] = useState('')

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

  // ===== Produk tersaring =====
  const filtered = products.filter((p) => {
    const cocokNama = p.name.toLowerCase().includes(search.toLowerCase())
    const cocokKategori = filterKategori === 'semua' || p.category_id === filterKategori
    const cocokStatus =
      filterStatus === 'semua' ||
      (filterStatus === 'aktif' && p.is_active) ||
      (filterStatus === 'nonaktif' && !p.is_active)
    return cocokNama && cocokKategori && cocokStatus
  })

  const jumlahAktif = products.filter((p) => p.is_active).length

  // ===== Aksi produk =====
  function openTambah() {
    setEditId(null)
    setFormName('')
    setFormPrice('')
    setFormCategory(categories[0]?.id || '')
    setShowForm(true)
  }

  function openEdit(product) {
    setEditId(product.id)
    setFormName(product.name)
    setFormPrice(String(product.price))
    setFormCategory(product.category_id)
    setShowForm(true)
  }

  async function handleSimpan(e) {
    e.preventDefault()
    const supabase = createClient()
    const data = {
      name: formName.trim(),
      price: parseInt(formPrice),
      category_id: formCategory,
    }

    let error
    if (editId) {
      ;({ error } = await supabase.from('products').update(data).eq('id', editId))
    } else {
      ;({ error } = await supabase.from('products').insert(data))
    }

    if (error) return alert('Gagal menyimpan: ' + error.message)
    setShowForm(false)
    fetchData()
  }

  async function toggleAktif(product) {
    const supabase = createClient()
    const { error } = await supabase
      .from('products')
      .update({ is_active: !product.is_active })
      .eq('id', product.id)
    if (error) return alert('Gagal: ' + error.message)
    fetchData()
  }

  async function handleHapus(product) {
    if (!confirm(`Hapus produk "${product.name}"?\n\nCatatan: produk yang pernah terjual tidak bisa dihapus (riwayat transaksi menjaganya). Gunakan "Nonaktifkan" saja.`)) return
    const supabase = createClient()
    const { error } = await supabase.from('products').delete().eq('id', product.id)
    if (error) {
      alert('Tidak bisa dihapus karena produk ini punya riwayat transaksi.\nGunakan "Nonaktifkan" saja agar tidak tampil di kasir.')
      return
    }
    fetchData()
  }

  // ===== Aksi kategori =====
  async function handleTambahKategori(e) {
    e.preventDefault()
    const supabase = createClient()
    const { error } = await supabase
      .from('categories')
      .insert({ name: namaKategoriBaru.trim() })
    if (error) return alert('Gagal: ' + error.message)
    setNamaKategoriBaru('')
    setShowKategori(false)
    fetchData()
  }

  return (
    <main className="min-h-screen bg-amber-50">
      <Navbar />
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
          <h1 className="text-2xl font-bold text-amber-900">📦 Manajemen Produk</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowKategori(true)}>
              + Kategori
            </Button>
            <Button className="bg-amber-700 hover:bg-amber-800" onClick={openTambah}>
              + Tambah Produk
            </Button>
          </div>
        </div>

        {/* Kartu ringkasan */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-gray-500">Total Produk</p>
              <p className="text-xl font-bold text-amber-800">{products.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-gray-500">Aktif (tampil di kasir)</p>
              <p className="text-xl font-bold text-green-700">{jumlahAktif}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-gray-500">Nonaktif</p>
              <p className="text-xl font-bold text-gray-500">{products.length - jumlahAktif}</p>
            </CardContent>
          </Card>
        </div>

        {/* Baris filter */}
        <div className="flex gap-2 mb-4 flex-wrap">
          <Input
            placeholder="🔍 Cari nama produk..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-56 bg-white"
          />
          <Select value={filterKategori} onValueChange={setFilterKategori}>
            <SelectTrigger className="w-44 bg-white">
              <SelectValue placeholder="Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="semua">Semua Kategori</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-36 bg-white">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="semua">Semua Status</SelectItem>
              <SelectItem value="aktif">Aktif</SelectItem>
              <SelectItem value="nonaktif">Nonaktif</SelectItem>
            </SelectContent>
          </Select>
          {(search || filterKategori !== 'semua' || filterStatus !== 'semua') && (
            <Button variant="ghost" size="sm"
              onClick={() => { setSearch(''); setFilterKategori('semua'); setFilterStatus('semua') }}>
              ✕ Reset
            </Button>
          )}
        </div>

        {/* Tabel produk */}
        {loading ? (
          <p className="text-amber-700">Memuat...</p>
        ) : filtered.length === 0 ? (
          <p className="text-gray-400 text-center mt-10">
            {products.length === 0 ? 'Belum ada produk.' : 'Tidak ada produk yang cocok dengan filter.'}
          </p>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead className="text-right">Harga</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => (
                  <TableRow key={p.id} className={!p.is_active ? 'opacity-60' : ''}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-gray-500">{p.categories?.name}</TableCell>
                    <TableCell className="text-right">
                      Rp {p.price.toLocaleString('id-ID')}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={p.is_active ? 'default' : 'secondary'}
                        className={p.is_active ? 'bg-green-600' : ''}>
                        {p.is_active ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-1">
                        <Button variant="outline" size="sm" onClick={() => openEdit(p)}>
                          Edit
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => toggleAktif(p)}>
                          {p.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                        </Button>
                        <Button variant="ghost" size="sm"
                          className="text-red-500 hover:text-red-600"
                          onClick={() => handleHapus(p)}>
                          🗑️
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>

      {/* Dialog form produk */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="w-96">
          <DialogHeader>
            <DialogTitle>{editId ? '✏️ Edit Produk' : '➕ Tambah Produk'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSimpan} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="nama">Nama produk</Label>
              <Input id="nama" value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required placeholder="Contoh: Americano" />
            </div>
            <div className="space-y-1.5">
              <Label>Kategori</Label>
              <Select value={formCategory} onValueChange={setFormCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="harga">Harga (Rp)</Label>
              <Input id="harga" type="number" value={formPrice}
                onChange={(e) => setFormPrice(e.target.value)}
                required placeholder="Contoh: 20000" />
              {formPrice && (
                <p className="text-xs text-gray-500">
                  = Rp {parseInt(formPrice || 0).toLocaleString('id-ID')}
                </p>
              )}
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" className="flex-1"
                onClick={() => setShowForm(false)}>
                Batal
              </Button>
              <Button type="submit" className="flex-1 bg-amber-700 hover:bg-amber-800">
                Simpan
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog kategori baru */}
      <Dialog open={showKategori} onOpenChange={setShowKategori}>
        <DialogContent className="w-80">
          <DialogHeader>
            <DialogTitle>🗂️ Tambah Kategori</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleTambahKategori} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="kat">Nama kategori</Label>
              <Input id="kat" value={namaKategoriBaru}
                onChange={(e) => setNamaKategoriBaru(e.target.value)}
                required placeholder="Contoh: Snack" />
            </div>
            <p className="text-xs text-gray-400">
              Kategori yang sudah ada: {categories.map((c) => c.name).join(', ')}
            </p>
            <Button type="submit" className="w-full bg-amber-700 hover:bg-amber-800">
              Simpan Kategori
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  )
}