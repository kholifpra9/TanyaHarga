type PriceIndicator = {
  emoji: string;
  label: string;
};

const THRESHOLD = 0.1; // 10% — di atas/bawah rata-rata dianggap signifikan

export function getPriceIndicator(currentPrice: number, averagePrice?: number): PriceIndicator {
  if (!averagePrice) {
    return { emoji: '⚪', label: 'Belum ada pembanding' };
  }

  const diffRatio = (currentPrice - averagePrice) / averagePrice;

  if (diffRatio <= -THRESHOLD) {
    return { emoji: '🟢', label: 'Murah' };
  }
  if (diffRatio >= THRESHOLD) {
    return { emoji: '🔴', label: 'Mahal' };
  }
  return { emoji: '🟡', label: 'Stabil' };
}