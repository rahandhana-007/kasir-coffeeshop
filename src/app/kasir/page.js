'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

export default function KasirPage() {
  const router = useRouter()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('semua')
  const [loading, setLoading] = useState(true)
  const [cart, setCart] = useState([]) // ← BARU: state keranjang
  const [showPayment, setShowPayment] = useState(false) // dialog bayar tampil/tidak
  const [payAmount, setPayAmount] = useState('')        // uang yang diterima
  const [saving, setSaving] = useState(false)           // sedang menyimpan?
  const [receipt, setReceipt] = useState(null) // data struk transaksi terakhir
  const [showCart, setShowCart] = useState(false) // panel keranjang di HP
  

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

  //async function handleLogout() {
   // const supabase = createClient()
    //await supabase.auth.signOut()
    //router.push('/login')
  //}

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

  // Buat nomor invoice: INV-20260801-143025
  function buatInvoice() {
    const now = new Date()
    const tgl = now.toISOString().slice(0, 10).replace(/-/g, '')
    const jam = now.toTimeString().slice(0, 8).replace(/:/g, '')
    return `INV-${tgl}-${jam}`
  }

  async function simpanTransaksi() {
    const bayar = parseInt(payAmount)
    setSaving(true)
    const supabase = createClient()

    // Ambil user yang sedang login (untuk dicatat sebagai kasir)
    const { data: { user } } = await supabase.auth.getUser()

    // 1. Simpan header transaksi
    const { data: trx, error } = await supabase
      .from('transactions')
      .insert({
        invoice_number: buatInvoice(),
        cashier_id: user.id,
        total: total,
        payment_amount: bayar,
        change_amount: bayar - total,
        payment_method: 'cash',
      })
      .select()
      .single()

    if (error) {
      alert('Gagal menyimpan transaksi: ' + error.message)
      setSaving(false)
      return
    }

    // 2. Simpan semua item keranjang
    const items = cart.map((item) => ({
      transaction_id: trx.id,
      product_id: item.id,
      product_name: item.name,
      price: item.price,
      quantity: item.qty,
      subtotal: item.price * item.qty,
    }))
    const { error: itemError } = await supabase
      .from('transaction_items')
      .insert(items)

    if (itemError) {
      alert('Gagal menyimpan item: ' + itemError.message)
      setSaving(false)
      return
    }

    
    // 3. Sukses! Simpan data untuk struk, lalu bersihkan
    setReceipt({
      invoice: trx.invoice_number,
      date: new Date().toLocaleString('id-ID'),
      items: [...cart],
      total: total,
      bayar: bayar,
      kembalian: bayar - total,
    })
    setCart([])
    setPayAmount('')
    setShowPayment(false)
    setSaving(false)
  }

  // Hitung total
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0)

  const filteredProducts =
    selectedCategory === 'semua'
      ? products
      : products.filter((p) => p.category_id === selectedCategory)

  return (
<main className="min-h-screen bg-amber-50 flex flex-col">
    <Navbar />
            <div className="flex flex-col md:flex-row flex-1 md:overflow-hidden">
      {/* ==================== KIRI: MENU ==================== */}
      <div className="flex-1 p-4 md:p-6 overflow-y-auto pb-28 md:pb-6">
                <h1 className="text-xl md:text-2xl font-bold text-amber-900 mb-4">☕ Kasir Coffee Shop</h1>
                

        {/* Filter kategori */}
<div className="flex gap-2 mb-4 overflow-x-auto pb-2 -mx-1 px-1">
          <button onClick={() => setSelectedCategory('semua')}
            className={`px-4 py-2 rounded-full text-sm font-medium ${
              selectedCategory === 'semua'
                ? 'bg-amber-700 text-white'
                : 'bg-white text-amber-900 border border-amber-300'}`}>
            Semua
          </button>
           {categories.map((cat) => (
            <button key={cat.id} onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap shrink-0 ${
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
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredProducts.map((product) => (
              <Card key={product.id}
                onClick={() => addToCart(product)}
                className="cursor-pointer hover:shadow-lg hover:scale-105 hover:border-amber-400 transition active:scale-95 select-none">
                <CardContent className="p-3">
                 <div className="text-2xl mb-1">☕</div>
                 <p className="font-semibold text-sm text-gray-800">{product.name}</p>
                 <p className="text-xs text-gray-400">{product.categories?.name}</p>
                 <p className="text-amber-700 font-bold text-sm mt-1">
                 Rp {product.price.toLocaleString('id-ID')}
               </p>
              </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* ==================== KANAN: KERANJANG ==================== */}
        <div className="hidden md:flex w-96 bg-white shadow-xl p-6 flex-col shrink-0">  
        <h2 className="text-lg font-bold text-gray-800 mb-4">
          🛒 Pesanan ({cart.reduce((s, i) => s + i.qty, 0)} item)
        </h2>

        {/* Daftar item */}
        <div className="flex-1 overflow-y-auto space-y-3 max-h-64 md:max-h-none">
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
            onClick={() => setShowPayment(true)}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white py-3 rounded-xl font-bold text-lg">
            💵 Bayar
          </button>
        </div>
      </div>

            {/* ==================== BAR KERANJANG MOBILE ==================== */}
      {cart.length > 0 && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-2xl p-3 flex items-center gap-3 z-40">
          <button onClick={() => setShowCart(true)} className="flex-1 text-left">
            <p className="text-xs text-gray-500">
              🛒 {cart.reduce((s, i) => s + i.qty, 0)} item — ketuk untuk lihat
            </p>
            <p className="text-lg font-bold text-amber-800">
              Rp {total.toLocaleString('id-ID')}
            </p>
          </button>
          <Button className="bg-green-600 hover:bg-green-700 h-12 px-6 font-bold"
            onClick={() => setShowPayment(true)}>
            💵 Bayar
          </Button>
        </div>
      )}

      {/* ==================== DIALOG KERANJANG MOBILE ==================== */}
      <Dialog open={showCart} onOpenChange={setShowCart}>
        <DialogContent className="w-[92vw] max-w-sm">
          <DialogHeader>
            <DialogTitle>🛒 Pesanan ({cart.reduce((s, i) => s + i.qty, 0)} item)</DialogTitle>
          </DialogHeader>
          <div className="max-h-72 overflow-y-auto space-y-3">
            {cart.map((item) => (
              <div key={item.id} className="flex items-center gap-2 border-b pb-2">
                <div className="flex-1">
                  <p className="font-medium text-sm">{item.name}</p>
                  <p className="text-xs text-gray-500">
                    Rp {item.price.toLocaleString('id-ID')} × {item.qty}
                  </p>
                </div>
                <button onClick={() => changeQty(item.id, -1)}
                  className="w-9 h-9 rounded-full bg-gray-200 font-bold text-lg">−</button>
                <span className="w-6 text-center font-semibold">{item.qty}</span>
                <button onClick={() => changeQty(item.id, 1)}
                  className="w-9 h-9 rounded-full bg-amber-700 text-white font-bold text-lg">+</button>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center border-t pt-3">
            <span className="text-gray-600">TOTAL</span>
            <span className="text-xl font-bold text-amber-800">
              Rp {total.toLocaleString('id-ID')}
            </span>
          </div>
          <Button className="w-full bg-green-600 hover:bg-green-700 h-12 font-bold"
            onClick={() => { setShowCart(false); setShowPayment(true) }}>
            💵 Bayar
          </Button>
        </DialogContent>
      </Dialog>
            
            {/* ==================== DIALOG PEMBAYARAN ==================== */}
      <Dialog open={showPayment} onOpenChange={(open) => {
        if (!open) { setShowPayment(false); setPayAmount('') }
      }}>
        <DialogContent className="w-96">
          <DialogHeader>
            <DialogTitle>💵 Pembayaran</DialogTitle>
          </DialogHeader>

          <div className="bg-amber-50 rounded-lg p-4">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Total belanja</span>
              <span className="font-bold text-lg text-amber-800">
                Rp {total.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600">Uang diterima</label>
            <Input
              type="number"
              autoFocus
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              placeholder="Contoh: 50000"
              className="text-xl font-bold mt-1"
            />
          </div>

          <div className="flex gap-2">
            <Button variant="secondary" size="sm" className="flex-1"
              onClick={() => setPayAmount(String(total))}>
              Uang Pas
            </Button>
            {[20000, 50000, 100000].map((nominal) => (
              <Button key={nominal} variant="secondary" size="sm" className="flex-1"
                onClick={() => setPayAmount(String(nominal))}>
                {nominal / 1000}rb
              </Button>
            ))}
          </div>

          {payAmount && parseInt(payAmount) >= total && (
            <div className="flex justify-between bg-green-50 rounded-lg p-3">
              <span className="text-sm text-gray-600">Kembalian</span>
              <span className="font-bold text-green-700">
                Rp {(parseInt(payAmount) - total).toLocaleString('id-ID')}
              </span>
            </div>
          )}
          {payAmount && parseInt(payAmount) < total && (
            <p className="text-red-500 text-sm">
              ⚠️ Uang kurang Rp {(total - parseInt(payAmount)).toLocaleString('id-ID')}
            </p>
          )}

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1"
              onClick={() => { setShowPayment(false); setPayAmount('') }}>
              Batal
            </Button>
            <Button className="flex-1 bg-green-600 hover:bg-green-700"
              onClick={simpanTransaksi}
              disabled={!payAmount || parseInt(payAmount) < total || saving}>
              {saving ? 'Menyimpan...' : 'Konfirmasi'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* ==================== DIALOG STRUK ==================== */}
      <Dialog open={!!receipt} onOpenChange={(o) => !o && setReceipt(null)}>
        <DialogContent className="w-80">
          {receipt && (
            <>
              <DialogHeader>
                <DialogTitle className="text-center">🧾 Struk Pembayaran</DialogTitle>
              </DialogHeader>

              {/* Area yang dicetak */}
              <div id="area-struk" className="font-mono text-sm text-gray-800">
                <div className="text-center mb-3">
                  <p className="font-bold text-base">☕ COFFEE SHOP SAYA</p>
                  <p className="text-xs">Jl. Contoh No. 123, Gunung Tua</p>
                  <p className="text-xs">Telp: 0812-3456-7890</p>
                </div>
                <div className="border-t border-b border-dashed py-2 my-2 text-xs">
                  <p>{receipt.invoice}</p>
                  <p>{receipt.date}</p>
                </div>
                {receipt.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-xs mb-1">
                    <span>{item.name} x{item.qty}</span>
                    <span>Rp {(item.price * item.qty).toLocaleString('id-ID')}</span>
                  </div>
                ))}
                <div className="border-t border-dashed mt-2 pt-2 space-y-1 text-xs">
                  <div className="flex justify-between font-bold text-sm">
                    <span>TOTAL</span>
                    <span>Rp {receipt.total.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Bayar</span>
                    <span>Rp {receipt.bayar.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Kembalian</span>
                    <span>Rp {receipt.kembalian.toLocaleString('id-ID')}</span>
                  </div>
                </div>
                <p className="text-center text-xs mt-3">— Terima kasih! —</p>
              </div>

              <Separator />

              {/* Tombol (tidak ikut tercetak) */}
              <div className="flex gap-2 print:hidden">
                <Button variant="outline" className="flex-1"
                  onClick={() => window.print()}>
                  🖨️ Cetak
                </Button>
                <Button className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={() => setReceipt(null)}>
                  Transaksi Baru
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </main>
  )
}