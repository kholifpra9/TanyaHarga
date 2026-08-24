import React from 'react';
import Link from 'next/link';

interface LogoProps {
  className?: string;
  showTagline?: boolean;
}

export function Logo({ className = '', showTagline = false }: LogoProps) {
  return (
    <div className={`flex items-center gap-3 inline-flex ${className}`}>
      {/* Icon Badge SVG */}
      <svg
        width="40"
        height="40"
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        {/* Base Container Tag */}
        <rect width="40" height="40" rx="12" fill="#3B6543" />
        
        {/* Lubang Tag Gantungan */}
        <circle cx="8" cy="8" r="2" fill="#FBF8F3" />

        {/* Daun Komoditas Pangan */}
        <path
          d="M20 8C20 8 25 11 25 14.5C25 18 20 19.5 20 19.5C20 19.5 15 18 15 14.5C15 11 20 8 20 8Z"
          fill="#FBF8F3"
        />

        {/* Tangkai / Batang Tanda Tanya (?) */}
        <path
          d="M16.5 21.5C16.5 19.8 18 19 20 19C22 19 23.5 19.8 23.5 21.5C23.5 23.5 20 24.8 20 27.5"
          stroke="#FBF8F3"
          strokeWidth="2.4"
          strokeLinecap="round"
        />

        {/* Aksen Dot Terracotta */}
        <circle cx="20" cy="31" r="1.6" fill="#C86D51" />
      </svg>

      {/* Brand Text */}
      <div className="flex flex-col">
        <span className="text-xl font-serif font-bold tracking-tight text-[#223326] leading-none">
          TanyaHarga<span className="text-[#C86D51]">.</span>
        </span>
        {showTagline && (
          <span className="text-[9px] font-sans font-bold tracking-wider text-[#5C6E60] uppercase mt-1">
            Pantauan Harga Warga
          </span>
        )}
      </div>
    </div>
  );
}