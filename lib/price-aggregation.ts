export type PriceRow = {
  commodity_id: string;
  commodity_name: string;
  base_unit?: string;
  market_id: string;
  market_name: string;
  price_per_base_unit: number;
  reported_at: string;
};

export type CommodityAggregate = {
  commodityId: string;
  commodityName: string;
  baseUnit: string;
  averagePrice: number;
  marketCount: number;
  latestReportedAt: string;
  singleMarketName?: string; 
};

export function aggregateByCommodity(rows: PriceRow[]): CommodityAggregate[] {
  // 1. Ambil laporan TERBARU per kombinasi commodity+market (dedup) —
  //    supaya pasar yang lapor 10x tidak mendominasi rata-rata dibanding pasar yang baru lapor 1x
  const latestPerCommodityMarket = new Map<string, PriceRow>();
  for (const row of rows) {
    const key = `${row.commodity_id}:${row.market_id}`;
    const existing = latestPerCommodityMarket.get(key);
    if (!existing || new Date(row.reported_at) > new Date(existing.reported_at)) {
      latestPerCommodityMarket.set(key, row);
    }
  }

  // 2. Group hasil dedup di atas per commodity, lalu rata-ratakan lintas pasar
  const grouped = new Map<string, PriceRow[]>();
  for (const row of latestPerCommodityMarket.values()) {
    if (!grouped.has(row.commodity_id)) grouped.set(row.commodity_id, []);
    grouped.get(row.commodity_id)!.push(row);
  }

  const result: CommodityAggregate[] = [];
  grouped.forEach((groupRows, commodityId) => {
    const averagePrice = groupRows.reduce((sum, r) => sum + r.price_per_base_unit, 0) / groupRows.length;
    const latestReportedAt = groupRows.reduce(
      (latest, r) => (new Date(r.reported_at) > new Date(latest) ? r.reported_at : latest),
      groupRows[0].reported_at
    );

    result.push({
      commodityId,
      commodityName: groupRows[0].commodity_name,
      baseUnit: groupRows[0].base_unit ?? 'kg',
      averagePrice,
      marketCount: groupRows.length,
      latestReportedAt,
      singleMarketName: groupRows.length === 1 ? groupRows[0].market_name : undefined,
    });
  });

  return result.sort((a, b) => a.commodityName.localeCompare(b.commodityName));
}