'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/ui/logo';
import { createClient } from '@/lib/supabase/client';

export function Footer() {
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    // Dapatkan session aktif
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null);
    });

    // Listen perubahan state auth
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email ?? null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    <footer className="bg-white border-t border-[#E8E1D5] mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
          
          {/* Section 1: Brand Info & Tagline */}
          <div className="md:col-span-5 space-y-4">
            <Link href="/" className="inline-block">
              <Logo showTagline={false} />
            </Link>
            <p className="text-xs sm:text-sm text-[#5C6E60] leading-relaxed max-w-sm">
              Platform independen transparansi harga bahan pokok tradisional Indonesia. Dikumpulkan dari laporan warga, diolah otomatis untuk semua.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FBF8F3] border border-[#E8E1D5] text-[11px] font-medium text-[#3B6543]">
              <span className="w-2 h-2 rounded-full bg-[#3B6543] animate-pulse" />
              Dari warga, untuk warga
            </div>
          </div>

          {/* Section 2: Navigasi Fitur Utama */}
          <div className="md:col-span-4 grid grid-cols-2 gap-6 text-xs sm:text-sm">
            <div className="space-y-3">
              <p className="font-serif font-bold text-[#223326] uppercase tracking-wider text-[11px]">
                Navigasi
              </p>
              <ul className="space-y-2.5 font-medium">
                <li>
                  <Link href="/ask-price" className="text-[#5C6E60] hover:text-[#3B6543] transition-colors">
                    Tanya Harga
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className="text-[#5C6E60] hover:text-[#3B6543] transition-colors">
                    Dashboard Harga
                  </Link>
                </li>
                <li>
                  <Link href="/report-price" className="text-[#5C6E60] hover:text-[#3B6543] transition-colors">
                    Lapor Harga Baru
                  </Link>
                </li>
              </ul>
            </div>

            {/* Dinamis berdasarkan Status Login */}
            <div className="space-y-3">
              <p className="font-serif font-bold text-[#223326] uppercase tracking-wider text-[11px]">
                Akun & Akses
              </p>
              <ul className="space-y-2.5 font-medium">
                {userEmail ? (
                  <>
                    <li className="text-[11px] text-[#3B6543] font-semibold truncate bg-[#FBF8F3] px-2 py-1 rounded-lg border border-[#E8E1D5]">
                      👤 {userEmail}
                    </li>
                    <li>
                      <Link href="/report-price/history" className="text-[#5C6E60] hover:text-[#3B6543] transition-colors">
                        Riwayat Laporan
                      </Link>
                    </li>
                    <li>
                      <Link href="/watchlist" className="text-[#5C6E60] hover:text-[#3B6543] transition-colors">
                        Komoditas Dipantau
                      </Link>
                    </li>
                  </>
                ) : (
                  <>
                    <li>
                      <Link href="/login" className="text-[#5C6E60] hover:text-[#3B6543] transition-colors">
                        Masuk Akun
                      </Link>
                    </li>
                    <li>
                      <Link href="/login?mode=signup" className="text-[#5C6E60] hover:text-[#3B6543] transition-colors">
                        Daftar Baru
                      </Link>
                    </li>
                  </>
                )}
              </ul>
            </div>
          </div>

          {/* Section 3: AI & Transparansi Notice */}
          <div className="md:col-span-3 space-y-3 bg-[#FBF8F3] p-4 rounded-2xl border border-[#E8E1D5]/80 self-start">
            <p className="font-serif font-bold text-xs text-[#223326] flex items-center gap-1.5">
              <span>🤖</span> Pemrosesan AI
            </p>
            <p className="text-[11px] text-[#5C6E60] leading-relaxed">
              Laporan bahasa alami diekstrak menggunakan AI secara otomatis. Data diperbarui secara berkala sesuai laporan komunitas.
            </p>
          </div>

        </div>

        {/* Bottom Bar: Copyright */}
        <div className="mt-12 pt-6 border-t border-[#E8E1D5]/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#5C6E60]">
          <p>© {new Date().getFullYear()} TanyaHarga. Hak cipta dilindungi.</p>
          <p className="text-[11px]">
            Didesain untuk transparansi pasar tradisional Indonesia.
          </p>
        </div>
      </div>
    </footer>
  );
}