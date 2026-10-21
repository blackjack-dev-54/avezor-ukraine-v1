// Pull a sample of real UA listings with their first photos, plus a contact sheet to choose from.
import fs from 'node:fs';
const API = 'https://api-ukraine.donmajor.com/properties';
const sets = [
  ['buy-apt', 'dealType=buy&objectType=apartment'],
  ['buy-house', 'dealType=buy&objectType=detached_house'],
  ['buy-com', 'dealType=buy&propertyType=buy_commercial'],
  ['rent-apt', 'dealType=rent&objectType=apartment'],
  ['rent-com', 'dealType=rent&objectType=office'],
];
const out = [];
for (const [tag, q] of sets) {
  const j = await (await fetch(`${API}?${q}&limit=60&page=1`)).json();
  for (const p of j.data) {
    if (!p.images || p.images.length < 4) continue;
    const pick = (img) => img.populated.find(x => x.type === 'desktop' && x.format === 'jpeg')?.url;
    const urls = p.images.slice(0, 3).map(pick).filter(Boolean);
    out.push({ tag, id: p.customId, slug: p.slug, title: p.title, city: p.city, district: p.district, area: p.areaMin ?? p.attributes?.area, usd: p.pricing?.convertedPrices?.USD, uah: p.pricing?.convertedPrices?.UAH, urls });
  }
}
fs.mkdirSync('data', { recursive: true });
fs.writeFileSync('data/candidates.json', JSON.stringify(out, null, 1));
const cells = out.flatMap(o => o.urls.map((u, i) => `<figure><img src="${u}" loading="eager"><figcaption>${o.tag} ${o.id}-${i} · ${o.city || ''}</figcaption></figure>`)).join('');
fs.writeFileSync('data/sheet.html', `<!doctype html><meta charset="utf-8"><style>body{margin:0;font:11px sans-serif;display:grid;grid-template-columns:repeat(10,1fr);gap:4px}img{width:100%;aspect-ratio:4/3;object-fit:cover;display:block}figure{margin:0}</style>${cells}`);
console.log(out.length, 'listings,', out.reduce((a, o) => a + o.urls.length, 0), 'photos');
