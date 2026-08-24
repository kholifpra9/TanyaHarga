import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Newsreader, JetBrains_Mono } from "next/font/google";
import { ToastNotice } from "@/components/ui/toast-notice";
import "./globals.css";
import { cn } from "@/lib/utils";

// Font Body & UI
const jakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

// Font Heading / Editorial Title
const newsreader = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-serif",
});

// Font Angka / Price Tag
const monoFont = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "TanyaHarga - Cek & Lapor Harga Pasar",
  description: "Papan harga pasar tradisional dari warga untuk warga.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="id"
      className={cn(
        "h-full antialiased",
        jakartaSans.variable,
        newsreader.variable,
        monoFont.variable,
        "font-sans"
      )}
    >
      {/* Cukup flex flex-col biasa tanpa animate-page-smooth */}
      <body className="min-h-full flex flex-col bg-[#FBF8F3] text-[#223326]">
        {children}
        <ToastNotice />
      </body>
    </html>
  );
}
