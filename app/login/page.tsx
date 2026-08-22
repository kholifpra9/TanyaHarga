'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') ?? '/report-price';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit() {
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
    <div className="max-w-sm mx-auto py-16 px-4 space-y-4">
      <h1 className="text-2xl font-semibold">{mode === 'login' ? 'Masuk' : 'Daftar'}</h1>
      <p className="text-sm text-muted-foreground">
        Login untuk lapor harga tanpa batas, simpan riwayat, dan pantau komoditas favorit.
      </p>

      <Input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <Button onClick={handleSubmit} disabled={isLoading} className="w-full">
        {isLoading ? 'Memproses...' : mode === 'login' ? 'Masuk' : 'Daftar'}
      </Button>

      {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}

      <button
        type="button"
        className="text-sm text-muted-foreground underline"
        onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
      >
        {mode === 'login' ? 'Belum punya akun? Daftar' : 'Sudah punya akun? Masuk'}
      </button>
    </div>
  );
}