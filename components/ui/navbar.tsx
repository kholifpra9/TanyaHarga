'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

export function Navbar() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null);
      setIsLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email ?? null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Close dropdown saat klik di luar area menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.reload();
  }

  // Mengambil huruf depan email untuk Avatar Badge
  const userInitial = userEmail ? userEmail.charAt(0).toUpperCase() : 'U';

  return (
    <header className="sticky top-0 z-50 bg-[#FBF8F3]/90 backdrop-blur-md border-b border-[#E8E1D5]">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <span className="w-3 h-3 rounded-full bg-[#3B6543] group-hover:scale-110 transition-transform" />
          <span className="text-xl font-bold tracking-tight text-[#223326] font-serif">
            TanyaHarga
          </span>
        </Link>

        {/* Center Nav Items */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#4A5D4E]">
          <Link href="/ask-price" className="hover:text-[#223326] transition-colors">
            Tanya Harga
          </Link>
          <Link href="/dashboard" className="hover:text-[#223326] transition-colors">
            Dashboard
          </Link>
          <Link href="/report-price" className="hover:text-[#223326] transition-colors">
            Lapor Harga
          </Link>
        </nav>

        {/* Right Auth Action */}
        <div className="flex items-center gap-3">
          {!isLoading && (
            <>
              {userEmail ? (
                /* Profile Avatar & Dropdown Menu */
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="flex items-center gap-2.5 p-1.5 pl-3 rounded-full bg-white border border-[#E8E1D5] hover:border-[#3B6543] transition-all focus:outline-none shadow-sm"
                  >
                    <span className="text-xs font-semibold text-[#223326] max-w-[110px] truncate">
                      {userEmail.split('@')[0]}
                    </span>
                    <div className="w-7 h-7 rounded-full bg-[#3B6543] text-[#FBF8F3] text-xs font-bold flex items-center justify-center shrink-0">
                      {userInitial}
                    </div>
                  </button>

                  {/* Dropdown Menu Box */}
                  {isMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-[#E8E1D5] shadow-lg p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="px-3 py-2 border-b border-[#E8E1D5]/60 mb-1">
                        <p className="text-[11px] font-medium text-[#5C6E60]">Login sebagai</p>
                        <p className="text-xs font-semibold text-[#223326] truncate">{userEmail}</p>
                      </div>

                      <div className="space-y-0.5">
                        <Link
                          href="/watchlist"
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-[#223326] hover:bg-[#FBF8F3] rounded-xl transition-colors"
                        >
                          📌 Watchlist Komoditas
                        </Link>
                        <Link
                          href="/report-price"
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-[#223326] hover:bg-[#FBF8F3] rounded-xl transition-colors"
                        >
                          ✍️ Lapor Harga Baru
                        </Link>
                      </div>

                      <div className="border-t border-[#E8E1D5]/60 mt-1 pt-1">
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-3 py-2 text-xs font-semibold text-[#C86D51] hover:bg-[#FDF2F0] rounded-xl transition-colors"
                        >
                          🚪 Keluar Akun
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* State Belum Login */
                <>
                  <Button
                    nativeButton={false}
                    render={<Link href="/login" />}
                    size="sm"
                    variant="ghost"
                    className="text-[#3B6543] hover:text-[#223326] hover:bg-[#EFEAE1] font-medium"
                  >
                    Masuk
                  </Button>
                  <Button
                    nativeButton={false}
                    render={<Link href="/ask-price" />}
                    size="sm"
                    className="bg-[#3B6543] text-[#FBF8F3] hover:bg-[#2D4E33] font-medium rounded-full px-4 shadow-sm"
                  >
                    Cari Harga
                  </Button>
                </>
              )}
            </>
          )}
        </div>

      </div>
    </header>
  );
}