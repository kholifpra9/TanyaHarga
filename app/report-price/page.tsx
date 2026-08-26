'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Navbar } from '@/components/ui/navbar';
import type { PriceReportItem } from '@/lib/schemas';

export default function ReportPricePage() {
  const [rawText, setRawText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [savedItems, setSavedItems] = useState<PriceReportItem[]>([]);
  const [pendingItems, setPendingItems] = useState<PriceReportItem[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit() {
    if (!rawText.trim()) return;
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
    } catch {
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
          category: item.category,
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

      setPendingItems((prev) => prev.filter((_, i) => i !== index));
      setSavedItems((prev) => [...prev, item]);
    } catch {
      setErrorMessage('Gagal terhubung ke server');
    }
  }

  return (
    <div className="bg-[#FBF8F3] text-[#223326] min-h-screen font-sans antialiased">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6">
        {/* Header Title & Riwayat Link */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E8E1D5] pb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#223326]">
              Lapor Harga Belanja
            </h1>
            <p className="text-xs sm:text-sm text-[#5C6E60] leading-relaxed mt-0.5">
              Tulis catatan belanjaanmu hari ini dengan kalimat bebas. AI kami yang merapikannya.
            </p>
          </div>
          <Link
            href="/report-price/history"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#3B6543] hover:underline bg-[#3B6543]/10 px-3 py-2 rounded-xl self-start sm:self-auto"
          >
            📜 Riwayat Saya
          </Link>
        </div>

        {/* Input Form Box */}
        <div className="bg-white p-4 sm:p-6 rounded-3xl border border-[#E8E1D5] shadow-sm space-y-4">
          <Textarea
            placeholder='Contoh: "Pasar Induk hari ini cabai rawit 45rb, telur 26rb/kg, bayam 2rb per ikat"'
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            rows={4}
            className="w-full p-3.5 text-sm bg-[#FBF8F3] rounded-2xl text-[#223326] placeholder:text-[#5C6E60]/50 border border-[#E8E1D5] focus:outline-none focus:border-[#3B6543] resize-none"
          />

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <span className="text-xs text-[#5C6E60]">
              💡 Kamu bisa sebutkan nama pasar, komoditas, dan nominal harga sekaligus.
            </span>
            <Button
              onClick={handleSubmit}
              disabled={isLoading || rawText.trim() === ''}
              className="bg-[#C86D51] text-white hover:bg-[#b05a40] font-medium px-6 py-2.5 rounded-xl w-full sm:w-auto shrink-0 shadow-sm"
            >
              {isLoading ? 'Mengekstrak Data...' : '+ Kirim Laporan'}
            </Button>
          </div>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="text-xs sm:text-sm text-[#C86D51] bg-[#FDF2F0] border border-[#F5D5CE] rounded-2xl p-4 space-y-1.5">
            <p className="font-medium">{errorMessage}</p>
            {errorMessage.includes('Login') && (
              <Link href="/login?redirectTo=/report-price" className="inline-block text-xs font-bold underline">
                Login Ke Akun Kamu
              </Link>
            )}
          </div>
        )}

        {/* Saved Items Container */}
        {savedItems.length > 0 && (
          <div className="bg-white rounded-3xl border border-[#E8E1D5] p-5 shadow-sm space-y-3">
            <h2 className="font-serif font-bold text-base text-[#223326] flex items-center gap-2">
              <span className="text-emerald-600">✅</span> Laporan Berhasil Disimpan ({savedItems.length})
            </h2>
            <div className="divide-y divide-[#E8E1D5]">
              {savedItems.map((item, i) => (
                <div key={i} className="py-2.5 flex items-center justify-between text-xs sm:text-sm">
                  <div>
                    <span className="font-bold text-[#223326]">{item.commodity}</span>
                    <span className="text-[#5C6E60]"> @ {item.market}</span>
                  </div>
                  <div className="font-mono font-bold text-[#3B6543]">
                    Rp{item.price.toLocaleString('id-ID')} <span className="font-normal text-[11px] text-[#5C6E60]">/ {item.quantity} {item.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pending Items Confirmation Card */}
        {pendingItems.length > 0 && (
          <div className="bg-[#FEFCE8] border border-[#FEF08A] rounded-3xl p-5 space-y-3 shadow-sm">
            <div className="space-y-0.5">
              <h2 className="font-serif font-bold text-base text-[#854D0E] flex items-center gap-1.5">
                <span>⚠️</span> Perlu Konfirmasi Data Baru ({pendingItems.length})
              </h2>
              <p className="text-xs text-[#854D0E]/80">
                Sistem menemukan nama komoditas atau pasar yang belum pernah terdaftar. Konfirmasi jika data sudah benar:
              </p>
            </div>

            <div className="space-y-2 pt-1">
              {pendingItems.map((item, i) => (
                <div
                  key={i}
                  className="p-3 bg-white rounded-2xl border border-[#FEF08A] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <p className="font-bold text-[#223326]">{item.commodity} — Rp{item.price.toLocaleString('id-ID')}</p>
                    <p className="text-[#5C6E60]">📍 {item.market}</p>
                    <div className="flex gap-1.5 pt-0.5">
                      {item.is_new_commodity && (
                        <span className="bg-[#FEF08A] text-[#854D0E] px-2 py-0.5 rounded text-[10px] font-bold">
                          Komoditas Baru
                        </span>
                      )}
                      {item.is_new_market && (
                        <span className="bg-[#FEF08A] text-[#854D0E] px-2 py-0.5 rounded text-[10px] font-bold">
                          Pasar Baru
                        </span>
                      )}
                    </div>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => handleConfirm(item, i)}
                    className="bg-[#3B6543] text-white hover:bg-[#2D4E33] rounded-xl text-xs font-medium self-end sm:self-center shrink-0"
                  >
                    Tambahkan ke Daftar
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}