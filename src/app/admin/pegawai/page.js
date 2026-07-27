'use client'
import { useEffect, useState } from 'react'
import { createClient, createTempClient } from '@/lib/supabase'
import { namaKeEmail } from '@/lib/pegawai'
import Navbar from '@/components/Navbar'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export default function PegawaiPage() {
  const [pegawai, setPegawai] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [nama, setNama] = useState('')
  const [pin, setPin] = useState('')
  const [saving, setSaving] = useState(false)

  async function fetchData() {
    const supabase = createClient()
    const { data } = await supabase
      .from('profiles').select('*').eq('role', 'kasir').order('name')
    setPegawai(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  async function handleDaftar(e) {
    e.preventDefault()
    if (!/^\d{6}$/.test(pin)) return alert('PIN harus tepat 6 angka!')
    setSaving(true)

    // 1. Buat akun auth memakai client sementara (session admin aman)
    const temp = createTempClient()
    const { data, error } = await temp.auth.signUp({
      email: namaKeEmail(nama),
      password: pin,
    })
    if (error) {
      alert(error.message.includes('already registered')
        ? 'Nama ini sudah terdaftar. Gunakan nama lain (misal tambah nama belakang).'
        : 'Gagal: ' + error.message)
      setSaving(false)
      return
    }

    // 2. Catat ke profiles sebagai kasir (pakai client utama = admin)
    const supabase = createClient()
    const { error: pErr } = await supabase
      .from('profiles')
      .insert({ id: data.user.id, role: 'kasir', name: nama.trim() })
    if (pErr) alert('Akun dibuat tapi gagal mencatat profil: ' + pErr.message)

    setNama(''); setPin(''); setShowForm(false); setSaving(false)
    fetchData()
  }

  return (
    <main className="min-h-screen bg-amber-50">
      <Navbar />
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-amber-900">👥 Pegawai</h1>
          <Button className="bg-amber-700 hover:bg-amber-800" onClick={() => setShowForm(true)}>
            + Daftarkan Pegawai
          </Button>
        </div>

        {loading ? <p className="text-amber-700">Memuat...</p> : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Nama Login</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pegawai.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name || '(tanpa nama)'}</TableCell>
                    <TableCell className="font-mono text-xs text-gray-500">
                      {p.name ? namaKeEmail(p.name).replace('@pegawai.pos', '') : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
        <p className="text-xs text-gray-400 mt-3">
          Untuk menghapus/mengganti PIN pegawai: Supabase Dashboard → Authentication → Users.
        </p>
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="w-80">
          <DialogHeader><DialogTitle>➕ Daftarkan Pegawai</DialogTitle></DialogHeader>
          <form onSubmit={handleDaftar} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="nama">Nama pegawai</Label>
              <Input id="nama" value={nama} onChange={(e) => setNama(e.target.value)}
                required placeholder="Contoh: Budi" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pin">PIN (6 angka)</Label>
              <Input id="pin" type="password" inputMode="numeric" maxLength={6}
                value={pin} onChange={(e) => setPin(e.target.value)}
                required placeholder="••••••" />
            </div>
            <Button type="submit" disabled={saving}
              className="w-full bg-amber-700 hover:bg-amber-800">
              {saving ? 'Mendaftarkan...' : 'Daftarkan'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  )
}