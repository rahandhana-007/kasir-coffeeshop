'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { namaKeEmail } from '@/lib/pegawai'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

export default function LoginPegawaiPage() {
  const [nama, setNama] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true); setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: namaKeEmail(nama),
      password: pin,
    })
    if (error) {
      setError('Nama atau PIN salah')
      setLoading(false)
    } else {
      router.push('/kasir')
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-100 via-amber-50 to-orange-100 p-4">
      <Card className="w-full max-w-sm shadow-xl">
        <CardHeader className="text-center">
          <div className="text-5xl mb-2">👤</div>
          <CardTitle className="text-2xl text-amber-900">Login Pegawai</CardTitle>
          <CardDescription>Masuk dengan nama & PIN</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="nama">Nama</Label>
              <Input id="nama" value={nama} onChange={(e) => setNama(e.target.value)}
                required placeholder="Contoh: Budi" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pin">PIN</Label>
              <Input id="pin" type="password" inputMode="numeric" maxLength={6}
                value={pin} onChange={(e) => setPin(e.target.value)}
                required placeholder="••••••" />
            </div>
            {error && (
              <p className="text-sm text-red-500 bg-red-50 rounded-lg p-2 text-center">{error}</p>
            )}
            <Button type="submit" disabled={loading}
              className="w-full bg-amber-700 hover:bg-amber-800 font-semibold">
              {loading ? 'Memproses...' : 'Masuk'}
            </Button>
            <p className="text-center text-sm text-gray-500">
              <Link href="/login" className="underline hover:text-amber-700">
                Login admin (email) →
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}