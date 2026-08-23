'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Navbar } from '@/components/ui/navbar';
import { createClient } from '@/lib/supabase/client';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') ?? '/report-price';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Email dan password wajib diisi.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const supabase = createClient();

    const { error } =
      mode === 'login'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

    if (error) {
      setErrorMessage(error.message);
      setIsLoading(false);
      return;
    }

    router.push(redirectTo);
    router.refresh();
  }

  return (
    <main className="max-w-md mx-auto px-6 py-12 sm:py-16">
      <div className="bg-white rounded-3xl border border-[#E8E1D5] shadow-sm p-6 sm:p-8 space-y-6">
        
        {/* Toggle Tab (Masuk vs Daftar) */}
        <div className="grid grid-cols-2 p-1 bg-[#FBF8F3] border border-[#E8E1D5] rounded-2xl text-xs font-semibold text-[#5C6E60]">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMessage(null);
            }}
            className={`py-2.5 rounded-xl transition-all ${
              mode === 'login'
                ? 'bg-white text-[#223326] shadow-sm font-bold'
                : 'hover:text-[#223326]'
            }`}
          >
            Masuk Akun
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setErrorMessage(null);
            }}
            className={`py-2.5 rounded-xl transition-all ${
              mode === 'signup'
                ? 'bg-white text-[#223326] shadow-sm font-bold'
                : 'hover:text-[#223326]'
            }`}
          >
            Daftar Baru
          </button>
        </div>

        {/* Header Title */}
        <div className="space-y-1.5 text-center">
          <h1 className="text-2xl font-serif font-bold text-[#223326]">
            {mode === 'login' ? 'Selamat Datang Kembali' : 'Bergabung dengan Warga'}
          </h1>
          <p className="text-xs text-[#5C6E60] leading-relaxed">
            {mode === 'login'
              ? 'Login untuk lapor harga tanpa batas dan pantau komoditas favoritmu.'
              : 'Buat akun dalam hitungan detik untuk mulai berkontribusi dalam catatan pasar.'}
          </p>
        </div>

        {/* Form Input */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-[#5C6E60]">Email</label>
            <Input
              type="email"
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-[#FBF8F3] border-[#E8E1D5] focus:border-[#3B6543] focus:ring-0 rounded-xl px-4 py-2.5 text-sm"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-[#5C6E60]">Password</label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-[#FBF8F3] border-[#E8E1D5] focus:border-[#3B6543] focus:ring-0 rounded-xl px-4 py-2.5 text-sm"
              required
            />
          </div>

          {errorMessage && (
            <div className="text-xs text-[#C86D51] bg-[#FDF2F0] border border-[#F5D5CE] p-3 rounded-xl font-medium">
              {errorMessage}
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#3B6543] text-[#FBF8F3] hover:bg-[#2D4E33] font-medium py-3 rounded-xl shadow-sm transition-all mt-2"
          >
            {isLoading
              ? 'Memproses...'
              : mode === 'login'
              ? 'Masuk Ke Akun'
              : 'Daftar Sekarang'}
          </Button>
        </form>

        {/* Switch Mode Helper Text */}
        <div className="text-center pt-2 border-t border-[#E8E1D5]/60 text-xs text-[#5C6E60]">
          {mode === 'login' ? (
            <p>
              Belum punya akun?{' '}
              <button
                type="button"
                className="text-[#3B6543] font-bold hover:underline"
                onClick={() => {
                  setMode('signup');
                  setErrorMessage(null);
                }}
              >
                Daftar di sini
              </button>
            </p>
          ) : (
            <p>
              Sudah punya akun?{' '}
              <button
                type="button"
                className="text-[#3B6543] font-bold hover:underline"
                onClick={() => {
                  setMode('login');
                  setErrorMessage(null);
                }}
              >
                Masuk ke akun
              </button>
            </p>
          )}
        </div>

      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <div className="bg-[#FBF8F3] text-[#223326] min-h-screen font-sans antialiased">
      <Navbar />
      <Suspense fallback={
        <div className="text-center py-12 text-sm text-[#5C6E60]">
          Memuat halaman login...
        </div>
      }>
        <LoginContent />
      </Suspense>
    </div>
  );
}