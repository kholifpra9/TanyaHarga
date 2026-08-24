import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Newsreader, JetBrains_Mono } from "next/font/google";
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

export default function RootLayout({ children }: LayoutProps<"/">) {
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
      <body className="min-h-full flex flex-col bg-[#FBF8F3] text-[#223326]">
        <div className="flex-1 animate-page-smooth">
          {children}
        </div>
      </body>
    </html>
  );
}
