import { Navbar } from '@/components/ui/navbar';

export default function Loading() {
  return (
    <div className="bg-[#FBF8F3] text-[#223326] min-h-screen font-sans antialiased">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        {/* Spinner Animasi Berwarna Sage Green */}
        <div className="w-10 h-10 border-3 border-[#E8E1D5] border-t-[#3B6543] rounded-full animate-spin" />
        
        <p className="text-xs font-semibold text-[#5C6E60] tracking-wide animate-pulse">
          Memuat halaman...
        </p>
      </main>
    </div>
  );
}