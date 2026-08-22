'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { PriceAnswer } from '@/lib/schemas';

export default function AskPricePage() {
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [answers, setAnswers] = useState<PriceAnswer[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit() {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/ask-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.error ?? 'Terjadi kesalahan, coba lagi');
        return;
      }

      setAnswers(data.answers);
    } catch (error) {
      setErrorMessage('Gagal terhubung ke server. Cek koneksi internet.');
    } finally {
      setIsLoading(false);
    }
  }

  function formatAnswer(answer: PriceAnswer): string {
    if (!answer.found) {
      return `${answer.commodity}: belum ada data harga.`;
    }

    const reportedDate = answer.reportedAt ? new Date(answer.reportedAt) : null;
    const timeAgo = reportedDate ? formatTimeAgo(reportedDate) : '';

    return `${answer.commodity} di ${answer.market}: Rp${answer.price?.toLocaleString('id-ID')} / ${answer.quantity} ${answer.unit}${timeAgo ? `, dilaporkan ${timeAgo}` : ''}`;
  }

  function formatTimeAgo(date: Date): string {
    const diffMs = Date.now() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 1) return 'baru saja';
    if (diffHours < 24) return `${diffHours} jam lalu`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} hari lalu`;
  }

  return (
    <div className="max-w-xl mx-auto py-10 px-4 space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Tanya Harga</h1>
        <p className="text-sm text-muted-foreground">
          Tanya harga komoditas dengan kalimat bebas, AI akan carikan jawabannya.
        </p>
      </div>

      <Textarea
        placeholder='Contoh: "cabe telor tomat di pasar induk berapa?"'
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        rows={3}
      />

      <Button onClick={handleSubmit} disabled={isLoading || question.trim() === ''}>
        {isLoading ? 'Mencari...' : 'Tanya'}
      </Button>

      {errorMessage && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
          {errorMessage}
        </p>
      )}

      {answers.length > 0 && (
        <div className="border rounded-lg p-4 space-y-2">
          {answers.map((answer, i) => (
            <p key={i} className={`text-sm ${answer.found ? '' : 'text-muted-foreground italic'}`}>
              {formatAnswer(answer)}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}