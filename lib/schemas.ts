import { z } from 'zod';

// Struktur 1 item hasil parsing AI
export const priceReportItemSchema = z.object({
  commodity: z.string().min(1),
  price: z.number().positive(),
  quantity: z.number().positive(),
  unit: z.string().min(1),
  market: z.string().min(1),
  is_new_commodity: z.boolean(),
  is_new_market: z.boolean(),
});

// AI diminta return object berisi array "items" (bukan array polos di root,
// karena beberapa mode JSON output di LLM lebih stabil kalau root-nya object)
export const priceReportResponseSchema = z.object({
  items: z.array(priceReportItemSchema),
});

// Tipe TypeScript otomatis diturunkan dari schema Zod di atas —
// jadi gak perlu tulis interface terpisah, cukup 1 sumber kebenaran
export type PriceReportItem = z.infer<typeof priceReportItemSchema>;
export type PriceReportResponse = z.infer<typeof priceReportResponseSchema>;