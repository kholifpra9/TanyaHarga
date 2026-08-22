'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { createClient } from '@/lib/supabase/client';
import type { PriceReportItem } from '@/lib/schemas';

export default function ReportPricePage() {
  const [rawText, setRawText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [savedItems, setSavedItems] = useState<PriceReportItem[]>([]);
  const [pendingItems, setPendingItems] = useState<PriceReportItem[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null);
    });
  }, []);

  async function handleSubmit() {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/report-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 403 && data.requiresLogin) {
          setErrorMessage(data.error);
        } else {
          setErrorMessage(data.error ?? 'Terjadi kesalahan, coba lagi');
        }
        return;
      }

      setSavedItems(data.saved);
      setPendingItems(data.needsConfirmation);
      setRawText('');
    } catch (error) {
      setErrorMessage('Gagal terhubung ke server. Cek koneksi internet.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleConfirm(item: PriceReportItem, index: number) {
      try {
          const response = await fetch('/api/confirm-new-entry', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                commodity: item.commodity,
                market: item.market,
                price: item.price,
                quantity: item.quantity,
                unit: item.unit,
            }),
          });

          if (!response.ok) {
            setErrorMessage('Gagal menyimpan konfirmasi');
            return;
          }

          // Pindahkan item dari pendingItems ke savedItems
          setPendingItems((prev) => prev.filter((_, i) => i !== index));
          setSavedItems((prev) => [...prev, item]);
      } catch (error) {
          setErrorMessage('Gagal terhubung ke server');
      }
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.reload();
  }

  return (
    <div className="max-w-xl mx-auto py-10 px-4 space-y-4">
      <div className="flex justify-between items-center text-sm">
        {userEmail ? (
          <>
            <span className="text-muted-foreground">Login sebagai {userEmail}</span>
            <button onClick={handleLogout} className="underline text-muted-foreground">Keluar</button>
          </>
        ) : (
          <a href="/login?redirectTo=/report-price" className="underline text-muted-foreground">
            Login untuk lapor tanpa batas
          </a>
        )}
      </div>

      <div>
        <h1 className="text-2xl font-semibold">Lapor Harga</h1>
        <p className="text-sm text-muted-foreground">
          Ketik laporan harga dengan kalimat bebas, AI akan otomatis mengekstrak datanya.
        </p>
      </div>

      <Textarea
        placeholder='Contoh: "Pasar Induk hari ini cabai rawit 45rb, telur 26rb/kg, bayam 2rb per ikat"'
        value={rawText}
        onChange={(e) => setRawText(e.target.value)}
        rows={4}
      />

      <Button onClick={handleSubmit} disabled={isLoading || rawText.trim() === ''}>
        {isLoading ? 'Memproses...' : 'Kirim Laporan'}
      </Button>

      {errorMessage && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
          <p>{errorMessage}</p>
          {errorMessage.includes('Login') && (
            <a href="/login?redirectTo=/report-price" className="underline font-medium">
              Login sekarang
            </a>
          )}
        </div>
      )}

      {savedItems.length > 0 && (
        <div className="border rounded-lg p-4 space-y-2">
          <p className="font-medium text-sm">✅ Tersimpan ({savedItems.length}):</p>
          {savedItems.map((item, i) => (
            <div key={i} className="text-sm text-muted-foreground">
              {item.commodity} — Rp{item.price.toLocaleString('id-ID')} / {item.quantity} {item.unit} @ {item.market}
            </div>
          ))}
        </div>
      )}

      {pendingItems.length > 0 && (
        <div className="border border-amber-300 bg-amber-50 rounded-lg p-4 space-y-3">
            <p className="font-medium text-sm">
            ⚠️ Perlu konfirmasi ({pendingItems.length}) — komoditas/pasar belum ada di daftar:
            </p>
            {pendingItems.map((item, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
                <span>
                {item.commodity} — Rp{item.price.toLocaleString('id-ID')} @ {item.market}
                {item.is_new_commodity && <span className="text-amber-700 ml-1">(komoditas baru)</span>}
                {item.is_new_market && <span className="text-amber-700 ml-1">(pasar baru)</span>}
                </span>
                <Button size="sm" variant="outline" onClick={() => handleConfirm(item, i)}>
                Tambahkan
                </Button>
            </div>
            ))}
        </div>
        )}
    </div>
  );
}