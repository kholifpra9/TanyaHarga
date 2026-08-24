import { Navbar } from '@/components/ui/navbar';

export default function GlobalLoading() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 space-y-4">
      {/* Spinner animasi warna Sage Green */}
      <div className="w-10 h-10 border-3 border-[#E8E1D5] border-t-[#3B6543] rounded-full animate-spin" />
      <p className="text-xs font-semibold text-[#5C6E60] animate-pulse">
        Memuat halaman...
      </p>
    </div>
  );
}