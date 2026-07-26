'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import Navbar from '@/components/Navbar'

export default function LaporanPage() {
  // Default: hari ini (format YYYY-MM-DD untuk input date)
  const [tanggal, setTanggal] = useState(() => {
    const now = new Date()
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
    return now.toISOString().slice(0, 10)
  })
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState(null) // transaksi yang dilihat detailnya

  useEffect(() => {
    async function fetchLaporan() {
      setLoading(true)
      const supabase = createClient()

      const awal = new Date(tanggal + 'T00:00:00')
      const akhir = new Date(tanggal + 'T23:59:59.999')

      const { data } = await supabase
        .from('transactions')
        .select('*, transaction_items(*)')
        .gte('created_at', awal.toISOString())
        .lte('created_at', akhir.toISOString())
        .order('created_at', { ascending: false })

      setTransactions(data || [])
      setLoading(false)
    }
    fetchLaporan()
  }, [tanggal]) // ← jalan ulang setiap tanggal berubah

  // Ringkasan
  const totalOmzet = transactions.reduce((s, t) => s + t.total, 0)
  const jumlahTransaksi = transactions.length

  // Produk terlaris
  const produkCount = {}
  transactions.forEach((t) =>
    t.transaction_items.forEach((item) => {
      produkCount[item.product_name] = (produkCount[item.product_name] || 0) + item.quantity
    })
  )
  const terlaris = Object.entries(produkCount).sort((a, b) => b[1] - a[1]).slice(0, 3)

  return (
    <main className="min-h-screen bg-amber-50 p-6">
        <Navbar />
      <div className="p-6">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-amber-900">📊 Laporan Penjualan</h1>
        <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)}
          className="border-2 border-amber-300 rounded-lg p-2 bg-white font-medium" />
      </div>

      {/* Kartu ringkasan */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow p-5">
          <p className="text-sm text-gray-500">Total Omzet</p>
          <p className="text-2xl font-bold text-green-700">
            Rp {totalOmzet.toLocaleString('id-ID')}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow p-5">
          <p className="text-sm text-gray-500">Jumlah Transaksi</p>
          <p className="text-2xl font-bold text-amber-800">{jumlahTransaksi}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-5">
          <p className="text-sm text-gray-500">Produk Terlaris</p>
          {terlaris.length === 0 ? (
            <p className="text-gray-400 text-sm mt-1">Belum ada penjualan</p>
          ) : (
            terlaris.map(([nama, qty], i) => (
              <p key={nama} className="text-sm font-medium">
                {i + 1}. {nama} <span className="text-gray-400">({qty}x)</span>
              </p>
            ))
          )}
        </div>
      </div>

      {/* Daftar transaksi */}
      {loading ? (
        <p className="text-amber-700">Memuat...</p>
      ) : transactions.length === 0 ? (
        <p className="text-gray-400 text-center mt-10">Tidak ada transaksi pada tanggal ini.</p>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-amber-100 text-amber-900">
              <tr>
                <th className="text-left p-3">Waktu</th>
                <th className="text-left p-3">Invoice</th>
                <th className="text-center p-3">Item</th>
                <th className="text-right p-3">Total</th>
                <th className="text-center p-3">Detail</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.id} className="border-t hover:bg-amber-50">
                  <td className="p-3">
                    {new Date(t.created_at).toLocaleTimeString('id-ID', {
                      hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="p-3 font-mono text-xs">{t.invoice_number}</td>
                  <td className="p-3 text-center">
                    {t.transaction_items.reduce((s, i) => s + i.quantity, 0)}
                  </td>
                  <td className="p-3 text-right font-semibold">
                    Rp {t.total.toLocaleString('id-ID')}
                  </td>
                  <td className="p-3 text-center">
                    <button onClick={() => setDetail(t)}
                      className="text-blue-600 hover:underline">Lihat</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Dialog detail transaksi */}
      {detail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-96 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-800 mb-1">Detail Transaksi</h3>
            <p className="text-xs font-mono text-gray-500 mb-4">{detail.invoice_number}</p>
            <div className="space-y-2 text-sm border-t border-b py-3">
              {detail.transaction_items.map((item) => (
                <div key={item.id} className="flex justify-between">
                  <span>{item.product_name} × {item.quantity}</span>
                  <span>Rp {item.subtotal.toLocaleString('id-ID')}</span>
                </div>
              ))}
            </div>
            <div className="text-sm space-y-1 mt-3">
              <div className="flex justify-between font-bold">
                <span>Total</span><span>Rp {detail.total.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Bayar</span><span>Rp {detail.payment_amount.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Kembalian</span><span>Rp {detail.change_amount.toLocaleString('id-ID')}</span>
              </div>
            </div>
            <button onClick={() => setDetail(null)}
              className="w-full mt-4 bg-gray-200 hover:bg-gray-300 rounded-xl py-2 font-semibold">
              Tutup
            </button>
          </div>
        </div>
      )}
      </div>
    </main>
  )
}