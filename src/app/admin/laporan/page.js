'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'

export default function LaporanPage() {
  const [mode, setMode] = useState('hari') // 'hari' | 'minggu' | 'bulan'
  const [tanggal, setTanggal] = useState(() => {
    const now = new Date()
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
    return now.toISOString().slice(0, 10)
  })
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState(null)

  // ===== Hitung rentang tanggal sesuai mode =====
  function hitungRentang() {
    const d = new Date(tanggal + 'T00:00:00')

    if (mode === 'hari') {
      const awal = new Date(d)
      const akhir = new Date(d)
      akhir.setHours(23, 59, 59, 999)
      return { awal, akhir }
    }

    if (mode === 'minggu') {
      // Minggu dimulai hari Senin
      const hari = d.getDay() // 0=Minggu, 1=Senin, ...
      const geserKeSenin = hari === 0 ? 6 : hari - 1
      const awal = new Date(d)
      awal.setDate(d.getDate() - geserKeSenin)
      const akhir = new Date(awal)
      akhir.setDate(awal.getDate() + 6)
      akhir.setHours(23, 59, 59, 999)
      return { awal, akhir }
    }

    // mode === 'bulan'
    const awal = new Date(d.getFullYear(), d.getMonth(), 1)
    const akhir = new Date(d.getFullYear(), d.getMonth() + 1, 0)
    akhir.setHours(23, 59, 59, 999)
    return { awal, akhir }
  }

  const { awal, akhir } = hitungRentang()

  // Teks keterangan periode, contoh: "Senin, 21 Jul – Minggu, 27 Jul 2026"
  const formatTgl = (dt) =>
    dt.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
  const labelPeriode =
    mode === 'hari'
      ? formatTgl(awal)
      : `${formatTgl(awal)}  –  ${formatTgl(akhir)}`

  // ===== Ambil data setiap mode/tanggal berubah =====
  useEffect(() => {
    async function fetchLaporan() {
      setLoading(true)
      const supabase = createClient()
      const { awal, akhir } = hitungRentang()

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
  }, [tanggal, mode]) // ← jalan ulang kalau tanggal ATAU mode berubah

  // ===== Ringkasan =====
  const totalOmzet = transactions.reduce((s, t) => s + t.total, 0)
  const jumlahTransaksi = transactions.length
  const rataRata = jumlahTransaksi > 0 ? Math.round(totalOmzet / jumlahTransaksi) : 0

  const produkCount = {}
  transactions.forEach((t) =>
    t.transaction_items.forEach((item) => {
      produkCount[item.product_name] = (produkCount[item.product_name] || 0) + item.quantity
    })
  )
  const terlaris = Object.entries(produkCount).sort((a, b) => b[1] - a[1]).slice(0, 3)

  return (
    <main className="min-h-screen bg-amber-50">
      <Navbar />
      <div className="p-6">
        <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
          <h1 className="text-2xl font-bold text-amber-900">📊 Laporan Penjualan</h1>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Tombol mode */}
            {[
              { id: 'hari', label: 'Harian' },
              { id: 'minggu', label: 'Mingguan' },
              { id: 'bulan', label: 'Bulanan' },
            ].map((m) => (
              <Button
                key={m.id}
                variant={mode === m.id ? 'default' : 'outline'}
                className={mode === m.id ? 'bg-amber-700 hover:bg-amber-800' : ''}
                size="sm"
                onClick={() => setMode(m.id)}
              >
                {m.label}
              </Button>
            ))}

            {/* Pilih tanggal acuan */}
            <Input
              type="date"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              className="w-40 bg-white"
            />
          </div>
        </div>

        {/* Keterangan periode aktif */}
        <p className="text-sm text-amber-800 mb-4">
          Periode: <span className="font-semibold">{labelPeriode}</span>
        </p>

        {/* Kartu ringkasan */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-gray-500">Total Omzet</p>
              <p className="text-2xl font-bold text-green-700">
                Rp {totalOmzet.toLocaleString('id-ID')}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-gray-500">Jumlah Transaksi</p>
              <p className="text-2xl font-bold text-amber-800">{jumlahTransaksi}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-gray-500">Rata-rata / Transaksi</p>
              <p className="text-2xl font-bold text-blue-700">
                Rp {rataRata.toLocaleString('id-ID')}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
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
            </CardContent>
          </Card>
        </div>

        {/* Tabel transaksi */}
        {loading ? (
          <p className="text-amber-700">Memuat...</p>
        ) : transactions.length === 0 ? (
          <p className="text-gray-400 text-center mt-10">
            Tidak ada transaksi pada periode ini.
          </p>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal & Waktu</TableHead>
                  <TableHead>Invoice</TableHead>
                  <TableHead className="text-center">Item</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-center">Detail</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>
                      {new Date(t.created_at).toLocaleString('id-ID', {
                        day: '2-digit', month: 'short',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{t.invoice_number}</TableCell>
                    <TableCell className="text-center">
                      {t.transaction_items.reduce((s, i) => s + i.quantity, 0)}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      Rp {t.total.toLocaleString('id-ID')}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button variant="link" size="sm" onClick={() => setDetail(t)}>
                        Lihat
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>

      {/* Dialog detail transaksi */}
      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="w-96">
          {detail && (
            <>
              <DialogHeader>
                <DialogTitle>Detail Transaksi</DialogTitle>
              </DialogHeader>
              <p className="text-xs font-mono text-gray-500">{detail.invoice_number}</p>
              <div className="space-y-2 text-sm border-t border-b py-3">
                {detail.transaction_items.map((item) => (
                  <div key={item.id} className="flex justify-between">
                    <span>{item.product_name} × {item.quantity}</span>
                    <span>Rp {item.subtotal.toLocaleString('id-ID')}</span>
                  </div>
                ))}
              </div>
              <div className="text-sm space-y-1">
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>Rp {detail.total.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Bayar</span>
                  <span>Rp {detail.payment_amount.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Kembalian</span>
                  <span>Rp {detail.change_amount.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </main>
  )
}