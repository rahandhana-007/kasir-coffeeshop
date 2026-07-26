'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleLogin(e) {
    e.preventDefault()
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError('Email atau password salah')
    else router.push('/kasir')
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-amber-50">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded-xl shadow w-80 space-y-4">
        <h1 className="text-xl font-bold text-center">☕ Kasir Coffee Shop</h1>
        <input className="w-full border rounded p-2" type="email" placeholder="Email"
          value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="w-full border rounded p-2" type="password" placeholder="Password"
          value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button className="w-full bg-amber-700 text-white rounded p-2 font-semibold">Masuk</button>
      </form>
    </main>
  )
}