'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Navbar } from '@/components/layout/navbar';
import { HelpModal } from '@/components/ui/help-modal';
import type { PriceReportItem } from '@/lib/schemas';

export default function ReportPricePage() {
  const [rawText, setRawText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [savedItems, setSavedItems] = useState<PriceReportItem[]>([]);
  const [pendingItems, setPendingItems] = useState<PriceReportItem[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showHelpModal, setShowHelpModal] = useState(false);

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
    <div className="bg-bg-organic text-text-main min-h-screen font-sans antialiased">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6">
        {/* Header Title & Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-soft pb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-text-main">
              Lapor Harga Belanja
            </h1>
            <p className="text-xs sm:text-sm text-text-muted leading-relaxed mt-0.5">
              Tulis catatan belanjaanmu hari ini dengan kalimat bebas. AI kami yang merapikannya.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            {/* Button Help / Panduan */}
            <button
              onClick={() => setShowHelpModal(true)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-market bg-white border border-border-soft hover:bg-bg-organic px-3 py-2 rounded-xl transition-colors shadow-sm cursor-pointer"
            >
              <span className="bg-primary-market text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold">?</span>
              Panduan Lapor
            </button>

            <Link
              href="/report-price/history"
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary-market hover:underline bg-primary-market/10 px-3 py-2 rounded-xl"
            >
              📜 Riwayat
            </Link>
          </div>
        </div>

        {/* Info Banner Tata Cara Singkat */}
        <div className="bg-primary-market/5 border border-primary-market/20 rounded-2xl p-3.5 space-y-1.5 text-xs">
          <div className="flex items-center justify-between font-bold text-primary-market">
            <span>💡 Tips Format Penulisan Laporan:</span>
            <button
              onClick={() => setShowHelpModal(true)}
              className="underline hover:text-primary-market/80 text-[11px] cursor-pointer"
            >
              Lihat Contoh Lengkap
            </button>
          </div>
          <p className="text-text-muted">
            Sebutkan <strong className="text-text-main">Nama Pasar</strong>, <strong className="text-text-main">Nama Barang</strong>, <strong className="text-text-main">Harga</strong>, dan <strong className="text-text-main">Satuan (kg, liter, ons, ikat, pcs)</strong> agar AI dapat mengenali laporanmu secara akurat.
          </p>
        </div>

        {/* Input Form Box */}
        <div className="bg-white p-4 sm:p-6 rounded-3xl border border-border-soft shadow-sm space-y-4">
          <Textarea
            placeholder='Contoh: "Pasar Induk Cianjur hari ini cabai rawit merah 45rb/kg, minyak goreng 16rb/liter, bayam 3rb per ikat, telur ras 28rb"'
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            rows={4}
            className="w-full p-3.5 text-sm bg-bg-organic rounded-2xl text-text-main placeholder:text-text-muted/50 border border-border-soft focus:outline-none focus:border-primary-market resize-none"
          />

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <span className="text-[11px] text-text-muted">
              ⚖️ Sertakan satuan acuan seperti <em>kg, liter, ons, ikat, atau pcs</em>.
            </span>
            <Button
              onClick={handleSubmit}
              disabled={isLoading || rawText.trim() === ''}
              className="bg-accent-terracotta text-white hover:bg-accent-terracotta/90 font-medium px-6 py-2.5 rounded-xl w-full sm:w-auto shrink-0 shadow-sm cursor-pointer"
            >
              {isLoading ? 'Mengekstrak Data...' : '+ Kirim Laporan'}
            </Button>
          </div>
        </div>

        {/* Modal Help Component */}
        <HelpModal
          isOpen={showHelpModal}
          onClose={() => setShowHelpModal(false)}
          title="Tata Cara & Petunjuk Lapor"
          confirmText="Saya Mengerti, Mulai Melaporkan"
        >
          {/* Komponen Wajib */}
          <div className="space-y-2">
            <h4 className="font-bold text-text-main text-sm">1. Komponen Wajib Laporan:</h4>
            <ul className="list-disc pl-4 space-y-1 leading-relaxed text-xs text-text-muted">
              <li><strong className="text-text-main">Nama Pasar:</strong> Sebutkan lokasi pasar (contoh: <em>Pasar Induk, Pasar Cipanas, Pasar Pasir Hayam</em>).</li>
              <li><strong className="text-text-main">Nama Barang:</strong> Komoditas yang dibeli (contoh: <em>Cabai Rawit, Daging Ayam, Ikan Gurame, Beras</em>).</li>
              <li><strong className="text-text-main">Nominal Harga:</strong> Angka harga (contoh: <em>45rb, 45000, 45 ribu</em>).</li>
              <li><strong className="text-text-main">Satuan (Unit):</strong> Wajib disertakan agar perhitungan akurat.</li>
            </ul>
          </div>

          {/* Contoh Satuan */}
          <div className="bg-bg-organic p-3 rounded-2xl border border-border-soft space-y-1">
            <h4 className="font-bold text-primary-market text-xs">⚖️ Contoh Satuan (Unit) yang Didukung:</h4>
            <p className="leading-relaxed text-[11px] text-text-muted">
              • <strong>kg / kilogram:</strong> Cabai, Beras, Daging, Telur<br/>
              • <strong>liter:</strong> Minyak Goreng, Susu<br/>
              • <strong>ons:</strong> Bawang, Bumbu dapur<br/>
              • <strong>ikat:</strong> Bayam, Kangkung, Daun Bawang<br/>
              • <strong>pcs / buah:</strong> Tahu, Tempe, Kelapa
            </p>
          </div>

          {/* Saran Kategori */}
          <div className="space-y-1.5">
            <h4 className="font-bold text-text-main text-xs">🏷️ Saran Kategori Komoditas (Otomatis Diisi AI):</h4>
            <div className="grid grid-cols-2 gap-1.5 text-[11px] text-text-muted">
              <span className="bg-bg-organic px-2.5 py-1 rounded-lg border border-border-soft">🐟 <strong>ikan:</strong> Gurame, Nila, Lele</span>
              <span className="bg-bg-organic px-2.5 py-1 rounded-lg border border-border-soft">🥩 <strong>daging:</strong> Sapi, Ayam, Telur</span>
              <span className="bg-bg-organic px-2.5 py-1 rounded-lg border border-border-soft">🌶️ <strong>bumbu:</strong> Cabai, Bawang</span>
              <span className="bg-bg-organic px-2.5 py-1 rounded-lg border border-border-soft">🥬 <strong>sayuran:</strong> Bayam, Wortel</span>
              <span className="bg-bg-organic px-2.5 py-1 rounded-lg border border-border-soft">🌾 <strong>karbohidrat:</strong> Beras, Kentang</span>
              <span className="bg-bg-organic px-2.5 py-1 rounded-lg border border-border-soft">🌻 <strong>minyak:</strong> Minyak Goreng</span>
            </div>
          </div>

          {/* Contoh Kalimat */}
          <div className="space-y-1">
            <h4 className="font-bold text-text-main text-xs">📝 Contoh Kalimat Laporan yang Bagus:</h4>
            <p className="p-2.5 bg-emerald-50 text-emerald-900 rounded-xl border border-emerald-200 italic font-mono text-[11px]">
              "Pasar Cipanas hari ini gurame 40rb per kg, bawang merah 1/2 kg 16rb, dan bayam 3rb per ikat"
            </p>
          </div>
        </HelpModal>

        {/* Error Notification */}
        {errorMessage && (
          <div className="text-xs sm:text-sm text-accent-terracotta bg-[#FDF2F0] border border-[#F5D5CE] rounded-2xl p-4 space-y-1.5">
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
          <div className="bg-white rounded-3xl border border-border-soft p-5 shadow-sm space-y-3">
            <h2 className="font-serif font-bold text-base text-text-main flex items-center gap-2">
              <span className="text-emerald-600">✅</span> Laporan Berhasil Disimpan ({savedItems.length})
            </h2>
            <div className="divide-y divide-border-soft">
              {savedItems.map((item, i) => (
                <div key={i} className="py-2.5 flex items-center justify-between text-xs sm:text-sm">
                  <div>
                    <span className="font-bold text-text-main">{item.commodity}</span>
                    <span className="text-text-muted"> @ {item.market}</span>
                  </div>
                  <div className="font-mono font-bold text-primary-market">
                    Rp{item.price.toLocaleString('id-ID')} <span className="font-normal text-[11px] text-text-muted">/ {item.quantity} {item.unit}</span>
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
                    <p className="font-bold text-text-main">{item.commodity} — Rp{item.price.toLocaleString('id-ID')}</p>
                    <p className="text-text-muted">📍 {item.market}</p>
                    <div className="flex gap-1.5 pt-0.5">
                      {item.is_new_commodity && (
                        <span className="bg-[#FEF08A] text-[#854D0E] px-2 py-0.5 rounded text-[10px] font-bold">
                          Komoditas Baru ({item.category ?? 'umum'})
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
                    className="bg-primary-market text-white hover:bg-primary-market/90 rounded-xl text-xs font-medium self-end sm:self-center shrink-0 cursor-pointer"
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