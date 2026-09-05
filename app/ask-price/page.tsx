'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Navbar } from '@/components/layout/navbar';
import { HelpModal } from '@/components/ui/help-modal';
import type { PriceAnswer } from '@/lib/schemas';
import { IconLamp } from '@/components/ui/icons';

function AskPriceContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [question, setQuestion] = useState(initialQuery);
  const [isLoading, setIsLoading] = useState(false);
  const [answers, setAnswers] = useState<PriceAnswer[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showHelpModal, setShowHelpModal] = useState(false);

  const executeQuery = useCallback(async (queryText: string) => {
    if (!queryText.trim()) return;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/ask-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: queryText }),
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

      setAnswers(data.answers);
    } catch {
      setErrorMessage('Gagal terhubung ke server. Cek koneksi internet.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialQuery) {
      executeQuery(initialQuery);
    }
  }, [initialQuery, executeQuery]);

  function handleSubmit() {
    executeQuery(question);
  }

  function formatTimeAgo(dateStr?: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const diffMs = Date.now() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 1) return 'baru saja';
    if (diffHours < 24) return `${diffHours} jam lalu`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} hari lalu`;
  }

  return (
    <main className="max-w-2xl mx-auto px-6 py-12 space-y-6">
      {/* Header Title & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-soft pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-text-main">
            Tanya Harga Bahan Pokok
          </h1>
          <p className="text-xs sm:text-sm text-text-muted leading-relaxed mt-0.5">
            Tanyakan harga komoditas dalam bahasa sehari-hari. AI kami akan memahami pertanyaanmu dan mencari data laporan warga terbaru.
          </p>
        </div>

        <button
          onClick={() => setShowHelpModal(true)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-market bg-white border border-border-soft hover:bg-bg-organic px-3 py-2 rounded-xl transition-colors shadow-sm self-start sm:self-auto shrink-0 cursor-pointer"
        >
          <span className="bg-primary-market text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold">?</span>
          Panduan Tanya
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-primary-market/5 border border-primary-market/20 rounded-2xl p-3.5 space-y-1.5 text-xs">
        <div className="flex items-center justify-between font-bold text-primary-market">
          <span className="inline-flex items-center gap-2"><IconLamp size={15} className="text-main shrink-0" /> Tips Tanya Harga:</span>
          <button
            onClick={() => setShowHelpModal(true)}
            className="underline hover:text-primary-market/80 text-[11px] cursor-pointer"
          >
            Lihat Contoh Lengkap
          </button>
        </div>
        <p className="text-text-muted">
          Kamu bisa menanyakan harga komoditas dalam bahasa sehari-hari. Sebutkan nama komoditas dan lokasi pasar jika ingin hasil yang spesifik.
        </p>
      </div>

      {/* Input Form */}
      <div className="bg-white p-5 rounded-3xl border border-border-soft shadow-sm space-y-4">
        <Textarea
          placeholder='Contoh: "cabe telor tomat di pasar induk berapa?"'
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={3}
          className="w-full p-3.5 text-sm bg-bg-organic rounded-2xl text-text-main placeholder:text-text-muted/50 border border-border-soft focus:outline-none focus:border-primary-market resize-none"
        />

        <div className="flex justify-between items-center">
          <span className="inline-flex items-center gap-2 text-xs text-text-muted/80">
            <IconLamp size={15} className="text-main shrink-0" /> Boleh tanya beberapa komoditas sekaligus
          </span>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || question.trim() === ''}
            className="bg-primary-market text-bg-organic hover:bg-primary-market/90 font-medium px-6 py-2.5 rounded-xl cursor-pointer"
          >
            {isLoading ? 'Mencari Data...' : 'Tanya Sekarang'}
          </Button>
        </div>
      </div>

      {/* Modal Help Component */}
      <HelpModal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
        title="Petunjuk & Cara Tanya Harga"
        icon="💡"
      >
        <div className="space-y-2">
          <h4 className="font-bold text-text-main text-sm">Contoh Pertanyaan yang Bisa Kamu Tulis:</h4>
          <ul className="list-disc pl-4 space-y-1.5 leading-relaxed text-xs text-text-muted">
            <li><strong className="text-primary-market">"cabe telor tomat di pasar induk berapa?"</strong> (mencari beberapa barang di pasar tertentu)</li>
            <li><strong className="text-primary-market">"berapa harga beras 1 kg di pasar baru?"</strong> (spesifik komoditas & pasar)</li>
            <li><strong className="text-primary-market">"daging sapi sama daging ayam hari ini berapaan?"</strong> (tanpa menyebut pasar, mengambil data terbaru)</li>
          </ul>
        </div>

        <div className="bg-bg-organic p-3 rounded-2xl border border-border-soft space-y-1">
          <h4 className="font-bold text-primary-market text-xs">💡 Catatan Tambahan:</h4>
          <p className="leading-relaxed text-[11px] text-text-muted">
            • Kamu bisa menanyakan lebih dari satu komoditas sekaligus dalam satu kalimat.<br />
            • Jika pasar tidak disebutkan, sistem akan menampilkan data laporan harga terbaru dari pasar mana pun yang tersedia.
          </p>
        </div>
      </HelpModal>

      {/* Error Message & Quota Limit */}
      {errorMessage && (
        <div className="text-sm text-accent-terracotta bg-[#FDF2F0] border border-[#F5D5CE] rounded-2xl p-4 space-y-2">
          <p className="font-medium">{errorMessage}</p>
          {errorMessage.includes('Login') && (
            <Link href="/login?redirectTo=/ask-price" className="inline-block text-xs font-bold underline">
              Login Ke Akun Kamu
            </Link>
          )}
        </div>
      )}

      {/* Answer Cards */}
      {answers.length > 0 && (
        <div className="bg-white rounded-3xl border border-border-soft p-6 shadow-sm space-y-4">
          <h2 className="font-serif font-bold text-lg border-b border-border-soft pb-3 text-text-main">
            Hasil Pantauan Harga
          </h2>
          <div className="divide-y divide-border-soft">
            {answers.map((ans, i) => (
              <div key={i} className="py-3 flex items-start justify-between gap-4">
                <div className="space-y-0.5">
                  <p className="font-semibold text-sm capitalize text-text-main">
                    {ans.commodity}
                  </p>
                  {ans.found ? (
                    <p className="text-xs text-text-muted">
                      📍 {ans.market} · dilaporkan {formatTimeAgo(ans.reportedAt)}
                    </p>
                  ) : (
                    <p className="text-xs text-accent-terracotta italic">
                      Belum ada laporan harga terbaru untuk komoditas ini.
                    </p>
                  )}
                </div>

                {ans.found && (
                  <div className="text-right shrink-0">
                    <p className="font-mono font-bold text-base text-primary-market">
                      Rp{ans.price?.toLocaleString('id-ID')}
                    </p>
                    <p className="text-[11px] text-text-muted">
                      per {ans.quantity} {ans.unit}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}

export default function AskPricePage() {
  return (
    <div className="bg-bg-organic text-text-main min-h-screen font-sans antialiased">
      <Navbar />
      <Suspense fallback={
        <div className="text-center py-12 text-sm text-text-muted">
          Memuat halaman tanya harga...
        </div>
      }>
        <AskPriceContent />
      </Suspense>
    </div>
  );
}