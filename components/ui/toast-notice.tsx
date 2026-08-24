'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

function ToastContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  useEffect(() => {
    const notice = searchParams.get('notice');

    if (notice === 'login-success') {
      setToast({
        message: '🎉 Berhasil masuk! Selamat datang kembali.',
        type: 'success',
      });
    } else if (notice === 'logout-success') {
      setToast({
        message: '👋 Berhasil keluar akun. Sampai jumpa lagi!',
        type: 'info',
      });
    }

    if (notice) {
      // Hapus query param 'notice' dari URL setelah toast ditunjukkan agar tidak muncul terus saat di-refresh
      const timer = setTimeout(() => {
        setToast(null);
        const params = new URLSearchParams(searchParams.toString());
        params.delete('notice');
        const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
        router.replace(newUrl, { scroll: false });
      }, 3500);

      return () => clearTimeout(timer);
    }
  }, [searchParams, pathname, router]);

  if (!toast) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div
        className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl border shadow-xl text-xs sm:text-sm font-semibold max-w-sm ${
          toast.type === 'success'
            ? 'bg-[#3B6543] text-white border-[#2D4E33]'
            : 'bg-[#223326] text-[#FBF8F3] border-[#18251B]'
        }`}
      >
        <span>{toast.message}</span>
        <button
          onClick={() => setToast(null)}
          className="ml-auto text-white/70 hover:text-white text-base leading-none"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

export function ToastNotice() {
  return (
    <Suspense fallback={null}>
      <ToastContent />
    </Suspense>
  );
}