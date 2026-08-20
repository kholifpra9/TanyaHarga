const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

function buildSystemPrompt(existingCommodities: string[], existingMarkets: string[]): string {
  return `Kamu adalah parser laporan harga pasar tradisional Indonesia.

Tugas kamu: ubah kalimat bebas dari user menjadi data terstruktur.

Daftar komoditas yang SUDAH ADA di sistem (cocokkan ke nama ini kalau maksudnya sama):
${existingCommodities.join(', ') || '(belum ada data)'}

Daftar pasar yang SUDAH ADA di sistem:
${existingMarkets.join(', ') || '(belum ada data)'}

Aturan:
- Kalau nama komoditas/pasar dari user cocok (walau beda penulisan, misal "cabe rawit" vs "Cabai Rawit") dengan daftar di atas, PAKAI nama yang sudah ada di daftar, dan set is_new_commodity/is_new_market ke false.
- Kalau benar-benar belum ada di daftar, gunakan nama yang ditulis user, dan set is_new_commodity/is_new_market ke true.
- Pecah satuan pecahan (misal "1/2 kg") menjadi quantity: 0.5, unit: "kg".
- Kalau tidak disebutkan quantity, asumsikan quantity: 1.
- Kalau satuan tidak disebutkan sama sekali, asumsikan "kg" sebagai default (satuan paling umum untuk bahan pokok pasar).

Balas HANYA dalam format JSON berikut, tanpa teks tambahan:
{
  "items": [
    {
      "commodity": "string",
      "price": number,
      "quantity": number,
      "unit": "string",
      "market": "string",
      "is_new_commodity": boolean,
      "is_new_market": boolean
    }
  ]
}`;
}

export async function parseGroqPriceReport(
  rawText: string,
  existingCommodities: string[],
  existingMarkets: string[]
) {
  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'openai/gpt-oss-20b',
      messages: [
        { role: 'system', content: buildSystemPrompt(existingCommodities, existingMarkets) },
        { role: 'user', content: rawText },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;

  return JSON.parse(content);
}