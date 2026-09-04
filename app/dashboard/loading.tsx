import { Navbar } from '@/components/layout/navbar';

export default function DashboardLoading() {
  return (
    <div className="bg-bg-organic text-text-main min-h-screen font-sans antialiased">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6">
        {/* Header Skeleton */}
        <div className="space-y-2">
          <div className="h-8 w-48 bg-border-soft/60 rounded-xl animate-pulse" />
          <div className="h-4 w-72 bg-border-soft/40 rounded-lg animate-pulse" />
        </div>

        {/* Filter Skeleton */}
        <div className="flex gap-3">
          <div className="h-10 w-36 bg-white rounded-xl border border-border-soft animate-pulse" />
          <div className="h-10 w-36 bg-white rounded-xl border border-border-soft animate-pulse" />
        </div>

        {/* Skeleton Card/Table List */}
        <div className="bg-white rounded-3xl border border-border-soft p-6 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-12 bg-bg-organic rounded-xl border border-border-soft/60 animate-pulse"
            />
          ))}
        </div>
      </main>
    </div>
  );
}