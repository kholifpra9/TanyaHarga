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
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
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

  // Close mobile nav saat berpindah halaman
  useEffect(() => {
    setIsMobileNavOpen(false);
  }, [pathname]);

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
    setIsMobileNavOpen(false);
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
      <header className="sticky top-0 z-40 bg-[#FBF8F3]/95 backdrop-blur-md border-b border-[#E8E1D5]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <span className="w-3 h-3 rounded-full bg-[#3B6543] group-hover:scale-125 transition-transform" />
            <span className="text-lg sm:text-xl font-bold tracking-tight text-[#223326] font-serif">
              TanyaHarga
            </span>
          </Link>

          {/* Nav Items Desktop */}
          <nav className="hidden md:flex items-center gap-2 text-sm font-medium">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 rounded-full transition-all duration-200 ${
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

          {/* Right Action Desktop + Mobile Hamburger Toggle */}
          <div className="flex items-center gap-2 sm:gap-3">
            {!isLoading && (
              <>
                {userEmail ? (
                  /* Profile Dropdown Desktop & Avatar Trigger Mobile */
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setIsMenuOpen(!isMenuOpen)}
                      className={`flex items-center gap-2 p-1.5 sm:pl-3.5 rounded-full border transition-all focus:outline-none shadow-sm cursor-pointer ${
                        isMenuOpen 
                          ? 'bg-[#EFEAE1] border-[#3B6543] ring-2 ring-[#3B6543]/20' 
                          : 'bg-white border-[#E8E1D5] hover:border-[#3B6543] hover:bg-[#FBF8F3]'
                      }`}
                    >
                      <span className="hidden sm:inline text-xs font-semibold text-[#223326] max-w-[120px] truncate">
                        {userEmail.split('@')[0]}
                      </span>
                      <div className="w-8 h-8 sm:w-7 sm:h-7 rounded-full bg-[#3B6543] text-white text-xs font-bold flex items-center justify-center shrink-0 shadow-inner">
                        {userInitial}
                      </div>
                    </button>

                    {/* Dropdown Menu */}
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
                            className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#223326] hover:bg-[#3B6543]/10 hover:text-[#3B6543] rounded-xl transition-all"
                          >
                            <span>📌</span> Watchlist Komoditas
                          </Link>
                          <Link
                            href="/report-price"
                            onClick={() => setIsMenuOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#223326] hover:bg-[#3B6543]/10 hover:text-[#3B6543] rounded-xl transition-all"
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
                  <div className="hidden sm:flex items-center gap-2">
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
                  </div>
                )}
              </>
            )}

            {/* Hamburger Button Mobile */}
            <button
              onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
              className="md:hidden p-2 rounded-xl bg-white border border-[#E8E1D5] text-[#223326] focus:outline-none"
              aria-label="Toggle Navigation"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                {isMobileNavOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                )}
              </svg>
            </button>
          </div>

        </div>

        {/* Mobile Slide-down Drawer */}
        {isMobileNavOpen && (
          <div className="md:hidden bg-white border-b border-[#E8E1D5] px-4 py-4 space-y-3 animate-in slide-in-from-top-2 duration-200 shadow-lg">
            <div className="flex flex-col space-y-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-[#3B6543] text-white font-semibold'
                        : 'text-[#5C6E60] hover:bg-[#FBF8F3] hover:text-[#223326]'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>

            {!userEmail && (
              <div className="pt-2 border-t border-[#E8E1D5] grid grid-cols-2 gap-2">
                <Button
                  nativeButton={false}
                  render={<Link href="/login" />}
                  variant="outline"
                  className="w-full border-[#E8E1D5] text-[#223326]"
                >
                  Masuk
                </Button>
                <Button
                  nativeButton={false}
                  render={<Link href="/ask-price" />}
                  className="w-full bg-[#3B6543] text-white"
                >
                  Cari Harga
                </Button>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Modal Logout Confirmation */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-[#E8E1D5] max-w-xs sm:max-w-sm w-full p-6 shadow-2xl space-y-4 text-center">
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