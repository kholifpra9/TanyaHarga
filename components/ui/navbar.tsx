'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

export function Navbar() {
  const pathname = usePathname();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
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

  // Close dropdown saat click outside
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
    setShowLogoutConfirm(false);
    setIsMenuOpen(false);
    window.location.href = '/';
  }

  const navLinks = [
    { href: '/ask-price', label: 'Tanya Harga' },
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/report-price', label: 'Lapor Harga' },
  ];

  const userInitial = userEmail ? userEmail.charAt(0).toUpperCase() : 'U';

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#FBF8F3]/90 backdrop-blur-md border-b border-[#E8E1D5]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <span className="w-3 h-3 rounded-full bg-[#3B6543] group-hover:scale-125 transition-transform" />
            <span className="text-xl font-bold tracking-tight text-[#223326] font-serif">
              TanyaHarga
            </span>
          </Link>

          {/* Nav Items dengan Active State Indicator */}
          <nav className="hidden md:flex items-center gap-2 text-sm font-medium">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 rounded-full transition-all duration-200 relative ${
                    isActive
                      ? 'bg-[#3B6543] text-white font-semibold shadow-sm'
                      : 'text-[#5C6E60] hover:text-[#223326] hover:bg-[#EFEAE1]'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Auth Action */}
          <div className="flex items-center gap-3">
            {!isLoading && (
              <>
                {userEmail ? (
                  /* Profile Dropdown Trigger */
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setIsMenuOpen(!isMenuOpen)}
                      className={`flex items-center gap-2.5 p-1.5 pl-3.5 rounded-full border transition-all focus:outline-none shadow-sm cursor-pointer ${
                        isMenuOpen 
                          ? 'bg-[#EFEAE1] border-[#3B6543] ring-2 ring-[#3B6543]/20' 
                          : 'bg-white border-[#E8E1D5] hover:border-[#3B6543] hover:bg-[#FBF8F3]'
                      }`}
                    >
                      <span className="text-xs font-semibold text-[#223326] max-w-[120px] truncate">
                        {userEmail.split('@')[0]}
                      </span>
                      <div className="w-7 h-7 rounded-full bg-[#3B6543] text-white text-xs font-bold flex items-center justify-center shrink-0 shadow-inner">
                        {userInitial}
                      </div>
                    </button>

                    {/* Dropdown Menu Box */}
                    {isMenuOpen && (
                      <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl border border-[#E8E1D5] shadow-xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                        <div className="px-3 py-2.5 bg-[#FBF8F3] rounded-xl border border-[#E8E1D5]/60 mb-1.5">
                          <p className="text-[10px] uppercase font-bold text-[#5C6E60] tracking-wider">
                            Akun Terhubung
                          </p>
                          <p className="text-xs font-semibold text-[#223326] truncate mt-0.5">
                            {userEmail}
                          </p>
                        </div>

                        <div className="space-y-0.5">
                          <Link
                            href="/watchlist"
                            onClick={() => setIsMenuOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#223326] hover:bg-[#3B6543]/10 hover:text-[#3B6543] rounded-xl transition-all cursor-pointer"
                          >
                            <span>📌</span> Watchlist Komoditas
                          </Link>
                          <Link
                            href="/report-price"
                            onClick={() => setIsMenuOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#223326] hover:bg-[#3B6543]/10 hover:text-[#3B6543] rounded-xl transition-all cursor-pointer"
                          >
                            <span>✍️</span> Lapor Harga Baru
                          </Link>
                        </div>

                        <div className="border-t border-[#E8E1D5]/80 mt-1.5 pt-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setIsMenuOpen(false);
                              setShowLogoutConfirm(true);
                            }}
                            className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-[#C86D51] hover:bg-[#FDF2F0] hover:text-[#B05238] rounded-xl transition-all cursor-pointer"
                          >
                            <span>Keluar dari Akun</span>
                            <span>🚪</span>
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
                      className={`text-[#3B6543] hover:text-[#223326] hover:bg-[#EFEAE1] font-medium ${
                        pathname === '/login' ? 'bg-[#EFEAE1] text-[#223326]' : ''
                      }`}
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

      {/* MODAL KONFIRMASI LOGOUT */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-[#E8E1D5] max-w-sm w-full p-6 shadow-2xl space-y-4 text-center animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 bg-[#FDF2F0] text-[#C86D51] rounded-full flex items-center justify-center mx-auto text-xl font-bold">
              🚪
            </div>
            <div className="space-y-1">
              <h3 className="font-serif font-bold text-lg text-[#223326]">
                Keluar Akun?
              </h3>
              <p className="text-xs text-[#5C6E60] leading-relaxed">
                Kamu perlu login kembali untuk mengakses kuota tanya harga tanpa batas.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowLogoutConfirm(false)}
                className="border-[#E8E1D5] text-[#223326] hover:bg-[#FBF8F3] rounded-xl font-medium"
              >
                Batal
              </Button>
              <Button
                type="button"
                onClick={handleLogout}
                className="bg-[#C86D51] text-white hover:bg-[#B05238] rounded-xl font-medium"
              >
                Ya, Keluar
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}