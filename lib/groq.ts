const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

function buildSystemPrompt(existingCommodities: string[], existingMarkets: string[]): string {
  return `Kamu adalah parser laporan harga pasar tradisional Indonesia.

Tugas kamu: ubah kalimat bebas dari user menjadi data terstruktur.

Daftar komoditas yang SUDAH ADA di sistem:
${existingCommodities.join(', ') || '(belum ada data)'}

Daftar pasar yang SUDAH ADA di sistem:
${existingMarkets.join(', ') || '(belum ada data)'}

Aturan Kategori (category):
- Tentukan kategori (category) komoditas secara mendetail dan spesifik dalam huruf kecil.
- Contoh kategori yang umum:
  * "ikan" (ikan gurame, lele, nila, udang, cumi)
  * "daging" (daging sapi, daging ayam, jeroan)
  * "bumbu" (cabai, bawang, jahe, kunyit, merica)
  * "sayuran" (bayam, kangkung, wortel, kubis, tomat)
  * "karbohidrat" (beras, kentang, singkong)
  * "minyak" (minyak goreng, mentega)
  * "sembako" (gula, garam, tepung)
  * "buah" (pisang, jeruk, apel)
- Jika komoditas tidak cocok dengan contoh di atas, buat kategori baru yang singkat, relevan, dan konsisten (misal: "olahan_susu", "kacang_kacangan").

Aturan Lainnya:
- Jika komoditas/pasar cocok dengan daftar existing, set is_new_commodity/is_new_market ke false. Jika belum ada, set ke true.
- Pecah satuan pecahan ("1/2 kg" -> quantity: 0.5, unit: "kg").
- Jika tidak ada satuan/quantity, gunakan default 1 kg.

Balas HANYA dalam format JSON:
{
  "items": [
    {
      "commodity": "string",
      "category": "string",
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

function buildQuestionSystemPrompt(existingCommodities: string[], existingMarkets: string[]): string {
  return `Kamu adalah parser pertanyaan harga pasar tradisional Indonesia.

Tugas kamu: dari pertanyaan bebas user, ekstrak KOMODITAS, PASAR, dan INTENT pencarian.

Daftar komoditas yang ADA di sistem:
${existingCommodities.join(', ') || '(belum ada data)'}

Daftar pasar yang ADA di sistem:
${existingMarkets.join(', ') || '(belum ada data)'}

Aturan INTENT (intent):
- Jika user menanyakan "termurah", "paling murah", "paling miring", set intent = "cheapest".
- Jika user menanyakan "termahal", "paling mahal", set intent = "pricy".
- Selain itu (tanya harga biasa/terbaru), set intent = "latest".

Aturan Komoditas & Pasar:
- Cocokkan nama komoditas yang disebut user ke nama yang PALING MIRIP dari daftar di atas.
- Kalau user menyebut beberapa komoditas sekaligus, masukkan semua ke array "commodities".
- Kalau user TIDAK menyebutkan nama pasar tertentu, set "market" ke null.

Balas HANYA dalam format JSON:
{
  "commodities": ["string"],
  "market": "string atau null",
  "intent": "cheapest" | "pricy" | "latest"
}`;
}

export async function parseGroqPriceQuestion(
  question: string,
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
        { role: 'system', content: buildQuestionSystemPrompt(existingCommodities, existingMarkets) },
        { role: 'user', content: question },
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
  return JSON.parse(data.choices[0].message.content);
}