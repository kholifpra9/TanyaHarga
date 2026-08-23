import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-[#FBF8F3]/90 backdrop-blur-md border-b border-[#E8E1D5]">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="w-3 h-3 rounded-full bg-[#3B6543] group-hover:scale-110 transition-transform" />
          <span className="text-xl font-bold tracking-tight text-[#223326] font-serif">
            TanyaHarga
          </span>
        </Link>

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

        <div className="flex items-center gap-3">
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
      </div>
    </header>
  );
}