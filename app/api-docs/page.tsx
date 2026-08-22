export default function ApiDocsPage() {
  return (
    <div className="max-w-2xl mx-auto py-10 px-4 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">API Publik TanyaHarga</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Data harga komoditas dari laporan komunitas, tersedia gratis untuk siapa saja.
        </p>
      </div>

      <section className="space-y-2">
        <h2 className="text-lg font-medium">Endpoint</h2>
        <code className="block bg-muted text-sm p-3 rounded-md">
          GET https://tanyaharga.vercel.app/api/prices
        </code>
        <p className="text-sm text-muted-foreground">
          Tidak butuh API key atau autentikasi. Bisa diakses langsung lewat browser, curl, atau kode apa pun yang bisa melakukan HTTP request.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-medium">Query Parameter</h2>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b text-left">
              <th className="py-2 pr-4">Parameter</th>
              <th className="py-2 pr-4">Wajib?</th>
              <th className="py-2">Keterangan</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="py-2 pr-4"><code>commodity</code></td>
              <td className="py-2 pr-4">Tidak</td>
              <td className="py-2">Filter nama komoditas, mendukung pencarian sebagian (misal <code>cabai</code> cocok dengan &quot;Cabai Rawit&quot;)</td>
            </tr>
            <tr>
              <td className="py-2 pr-4"><code>market</code></td>
              <td className="py-2 pr-4">Tidak</td>
              <td className="py-2">Filter nama pasar, mendukung pencarian sebagian</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-medium">Contoh Request</h2>
        <pre className="bg-muted text-sm p-3 rounded-md overflow-x-auto">
{`curl "https://tanyaharga.vercel.app/api/prices?commodity=cabai&market=induk"`}
        </pre>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-medium">Contoh Response</h2>
        <pre className="bg-muted text-sm p-3 rounded-md overflow-x-auto">
{`{
  "data": [
    {
      "commodity": "Cabai Rawit",
      "market": "Pasar Induk",
      "price": 45000,
      "quantity": 1,
      "unit": "kg",
      "pricePerBaseUnit": 45000,
      "reportedAt": "2026-08-20T10:00:00.000Z"
    }
  ]
}`}
        </pre>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-medium">Catatan</h2>
        <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
          <li>Data diurutkan dari laporan terbaru ke terlama.</li>
          <li>Belum ada rate limit di endpoint ini — mohon gunakan secara wajar.</li>
          <li>Data berasal dari laporan komunitas, akurasinya tergantung partisipasi pelapor.</li>
        </ul>
      </section>
    </div>
  );
}