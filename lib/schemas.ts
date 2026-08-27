import { z } from 'zod';

// Struktur 1 item hasil parsing AI untuk Laporan Harga
export const priceReportItemSchema = z.object({
  commodity: z.string().min(1),
  category: z.string().optional(),
  price: z.number().positive(),
  quantity: z.number().positive(),
  unit: z.string().min(1),
  market: z.string().min(1),
  is_new_commodity: z.boolean(),
  is_new_market: z.boolean(),
});

export const priceReportResponseSchema = z.object({
  items: z.array(priceReportItemSchema),
});

// Schema untuk hasil extract intent Tanya Harga (Epic 5)
export const priceQuestionSchema = z.object({
  commodities: z.array(z.string().min(1)).min(1),
  market: z.string().nullable(),
  intent: z.enum(['cheapest', 'pricy', 'latest']).optional().default('latest'), // Tambahan intent
});

export type PriceQuestion = z.infer<typeof priceQuestionSchema>;

// Struktur 1 jawaban yang dikembalikan ke user setelah query database
export type PriceAnswer = {
  commodity: string;
  found: boolean;
  market?: string;
  price?: number;
  quantity?: number;
  unit?: string;
  reportedAt?: string;
  note?: string; // Tambahan catatan intent (misal: "Termurah")
};

export type PriceReportItem = z.infer<typeof priceReportItemSchema>;
export type PriceReportResponse = z.infer<typeof priceReportResponseSchema>;