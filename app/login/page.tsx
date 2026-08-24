'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Navbar } from '@/components/ui/navbar';
import { createClient } from '@/lib/supabase/client';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') ?? '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // State baru untuk menangani status butuh konfirmasi email
  const [isEmailSent, setIsEmailSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Email dan password wajib diisi.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const supabase = createClient();

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        setErrorMessage(error.message);
        setIsLoading(false);
        return;
      }

      // Jika login berhasil, redirect dengan toast notice
      const targetUrl = redirectTo.includes('?')
        ? `${redirectTo}&notice=login-success`
        : `${redirectTo}?notice=login-success`;

      router.push(targetUrl);
      router.refresh();
    } else {
      // MODE SIGNUP / DAFTAR
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/login?redirectTo=${encodeURIComponent(redirectTo)}&notice=login-success`,
        }
      });

      if (error) {
        setErrorMessage(error.message);
        setIsLoading(false);
        return;
      }

      setIsLoading(false);

      // Cek apakah Supabase mewajibkan konfirmasi email (user ada tapi session null)
      if (data.user && !data.session) {
        setIsEmailSent(true);
      } else {
        // Jika di Supabase "Confirm Email" dimatikan, otomatis ter-login
        router.push(`${redirectTo}?notice=login-success`);
        router.refresh();
      }
    }
  }

  return (
    <main className="max-w-md mx-auto px-6 py-12 sm:py-16">
      <div className="bg-white rounded-3xl border border-[#E8E1D5] shadow-sm p-6 sm:p-8 space-y-6">
        
        {/* TAMPILAN JIKA EMAIL KONFIRMASI SUDAH DIKIRIM */}
        {isEmailSent ? (
          <div className="text-center space-y-4 py-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-14 h-14 bg-[#3B6543]/10 text-[#3B6543] rounded-full flex items-center justify-center mx-auto text-2xl">
              ✉️
            </div>

            <div className="space-y-1.5">
              <h1 className="text-2xl font-serif font-bold text-[#223326]">
                Cek Email Kamu
              </h1>
              <p className="text-xs text-[#5C6E60] leading-relaxed">
                Kami telah mengirim tautan konfirmasi pendaftaran ke: <br />
                <strong className="text-[#223326]">{email}</strong>
              </p>
            </div>

            <div className="p-3.5 bg-[#FBF8F3] border border-[#E8E1D5] rounded-2xl text-xs text-[#5C6E60] text-left space-y-1">
              <p className="font-semibold text-[#223326]">Langkah selanjutnya:</p>
              <ol className="list-decimal list-inside space-y-0.5">
                <li>Buka inbox / folder spam email kamu.</li>
                <li>Klik tombol / tautan verifikasi.</li>
                <li>Kembali ke sini untuk masuk ke akunmu.</li>
              </ol>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <Button
                type="button"
                onClick={() => {
                  setIsEmailSent(false);
                  setMode('login');
                }}
                className="w-full bg-[#3B6543] text-white hover:bg-[#2D4E33] font-medium py-2.5 rounded-xl text-xs"
              >
                Sudah Verifikasi? Masuk Sekarang
              </Button>
              <button
                type="button"
                onClick={() => setIsEmailSent(false)}
                className="text-xs text-[#5C6E60] hover:underline"
              >
                Ganti Alamat Email
              </button>
            </div>
          </div>
        ) : (
          /* FORM LOGIN / SIGNUP BIASA */
          <>
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
                  : 'Daftar Akun Baru'}
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
          </>
        )}

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