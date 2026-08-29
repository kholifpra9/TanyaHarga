'use client';

import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon?: string;
  confirmText?: string;
  children: ReactNode;
}

export function HelpModal({
  isOpen,
  onClose,
  title,
  icon = '📖',
  confirmText = 'Saya Mengerti',
  children,
}: HelpModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 border border-[#E8E1D5] shadow-xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-[#E8E1D5] pb-3">
          <h3 className="font-serif font-bold text-lg text-[#223326] flex items-center gap-2">
            <span>{icon}</span> {title}
          </h3>
          <button
            onClick={onClose}
            className="text-[#5C6E60] hover:text-[#223326] font-bold text-lg w-7 h-7 rounded-full bg-[#FBF8F3] flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 text-xs text-[#5C6E60] max-h-[65vh] overflow-y-auto pr-1">
          {children}
        </div>

        <Button
          onClick={onClose}
          className="w-full bg-[#3B6543] text-white hover:bg-[#2D4E33] rounded-xl font-medium text-xs py-2.5 transition-colors"
        >
          {confirmText}
        </Button>
      </div>
    </div>
  );
}